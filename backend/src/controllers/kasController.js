import { query } from '../config/db.js';
import { transactions } from '../data/initialData.js';

// @desc    Get transactions & financial summary from DB
// @route   GET /api/kas
export const getKasSummaryAndTransactions = async (req, res, next) => {
  try {
    const listSql = `
      SELECT 
        ct.tx_id AS id,
        ct.description AS label,
        CAST(ct.amount_idr AS DECIMAL(12,2)) AS amount,
        LOWER(ct.tx_type) AS type,
        ct.category,
        DATE_FORMAT(ct.tx_date, '%e %b') AS date,
        ct.tx_date AS rawDate,
        DATE_FORMAT(ct.created_at, '%Y-%m-%d %H:%i:%s') AS formattedDateTime,
        ct.created_at AS createdAt,
        COALESCE(op.name, 'Operator') AS operator
      FROM cash_transactions ct
      LEFT JOIN operators op ON ct.operator_id = op.operator_id
      ORDER BY ct.tx_date DESC, ct.tx_id DESC;
    `;
    const rows = await query(listSql);

    const formattedList = rows.map((r) => ({
      id: r.id,
      label: r.label,
      amount: parseFloat(r.amount || 0),
      type: r.type,
      category: r.category || '',
      date: (r.date || '').trim(),
      rawDate: r.rawDate,
      createdAt: r.createdAt,
      operator: r.operator,
    }));

    const totalIncome = formattedList
      .filter((t) => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = formattedList
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const balance = totalIncome - totalExpense;

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
      count: formattedList.length,
      data: formattedList,
    });
  } catch (error) {
    console.warn('[kasController] Fallback ke in-memory kas:', error.message);
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const balance = totalIncome - totalExpense;

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
      count: transactions.length,
      data: transactions,
      isFallback: true,
    });
  }
};

// @desc    Create new transaction (income / expense) in DB
// @route   POST /api/kas
export const createTransaction = async (req, res, next) => {
  try {
    const { label, amount, type, category = '', date, operator = 'Rina' } = req.body;

    if (!label || amount === undefined || !type) {
      return res.status(400).json({
        success: false,
        message: 'Label/keterangan, nominal (amount), dan jenis transaksi (type) wajib diisi',
      });
    }

    const normalizedType = type.toLowerCase();
    if (!['income', 'expense'].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Type harus berupa 'income' atau 'expense'",
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal transaksi harus lebih besar dari 0',
      });
    }

    // Default kategori jika kosong
    const finalCategory = category || (normalizedType === 'income' ? 'penjualan' : 'operasional');

    // Operator ID
    let operatorId = 1;
    try {
      const opRows = await query('SELECT operator_id FROM operators WHERE name = ? LIMIT 1', [operator]);
      if (opRows && opRows.length > 0) {
        operatorId = opRows[0].operator_id;
      }
    } catch {
      operatorId = 1;
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const txDateStr = date || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const insertSql = `
      INSERT INTO cash_transactions (
        block_id, operator_id, tx_date, tx_type, category, description, amount_idr, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW());
    `;

    const result = await query(insertSql, [
      1, // default block 1
      operatorId,
      txDateStr,
      normalizedType.toUpperCase(),
      finalCategory,
      label,
      numAmount,
    ]);

    const newId = result.insertId;
    const dateFormatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    const newTransaction = {
      id: newId,
      label,
      amount: numAmount,
      type: normalizedType,
      category: finalCategory,
      date: dateFormatted,
      rawDate: txDateStr,
      createdAt: now.toISOString(),
      operator,
    };

    // Update in-memory fallback juga
    transactions.unshift(newTransaction);

    res.status(201).json({
      success: true,
      message: `${normalizedType === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil disimpan ke database`,
      data: newTransaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction from DB
// @route   DELETE /api/kas/:id
export const deleteTransaction = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  try {
    const result = await query('DELETE FROM cash_transactions WHERE tx_id = ?', [id]);

    if (result.affectedRows === 0) {
      // In-memory fallback
      const index = transactions.findIndex((t) => t.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
      }
      const deleted = transactions.splice(index, 1);
      return res.json({
        success: true,
        message: 'Transaksi berhasil dihapus (in-memory)',
        data: deleted[0],
      });
    }

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus dari database',
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};
