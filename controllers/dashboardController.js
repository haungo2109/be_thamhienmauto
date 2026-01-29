const Order = require('../models/Order');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const { period } = req.query;
    let startDate, endDate, groupBy, nameFormat;

    endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Set to end of today

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // Last 7 days
        startDate.setHours(0, 0, 0, 0);
        groupBy = 'DATE("created_at"), EXTRACT(DOW FROM "created_at")';
        nameFormat = 'EXTRACT(DOW FROM "created_at")'; // For 'T2', 'T3', etc. (0=Sunday, 1=Monday)
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 5); // Last 6 months
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupBy = 'EXTRACT(YEAR FROM "created_at"), EXTRACT(MONTH FROM "created_at")';
        nameFormat = 'EXTRACT(MONTH FROM "created_at")'; // For 'T1', 'T2', etc.
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 5); // Last 6 years (adjust as needed)
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupBy = 'EXTRACT(YEAR FROM "created_at")';
        nameFormat = 'EXTRACT(YEAR FROM "created_at")'; // For '2020', '2021', etc.
        break;
      default:
        return res.status(400).json({ message: "Invalid period. Must be 'week', 'month', or 'year'." });
    }

    const stats = await Order.findAll({
      attributes: [
        [sequelize.literal(nameFormat), 'name'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT "user_id"')), 'customers'],
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
        status: {
          [Op.in]: ['completed', 'shipped'], // Only count completed or shipped orders for revenue/orders
        },
      },
      group: sequelize.literal(groupBy),
      order: sequelize.literal(groupBy),
      raw: true,
    });

    // Format the name for months (T1, T2,...) and days (T2, T3,...)
    const formattedStats = stats.map(item => {
      let name = item.name;
      if (period === 'month') {
        name = `T${item.name}`; // 'T1', 'T2', ...
      } else if (period === 'week') {
        const dayMap = {
          0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7'
        };
        name = dayMap[item.name] || name; // 'T2', 'T3', ...
      }
      return {
        name: String(name),
        revenue: parseFloat(item.revenue || 0),
        orders: parseInt(item.orders || 0),
        customers: parseInt(item.customers || 0),
      };
    });

    res.status(200).json(formattedStats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

exports.getPaymentMethodStats = async (req, res, next) => {
  try {
    const paymentStats = await Order.findAll({
      attributes: [
        'payment_method_id',
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalAmount'],
      ],
      where: {
        status: {
          [Op.in]: ['completed', 'shipped'], // Only count completed or shipped orders
        },
      },
      group: ['payment_method_id'],
      raw: true,
    });

    const totalRevenue = paymentStats.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0);

    const formattedPaymentStats = paymentStats.map(item => ({
      name: item.payment_method_id, // Assuming payment_method_id is a descriptive name
      value: totalRevenue > 0 ? (parseFloat(item.totalAmount) / totalRevenue) * 100 : 0,
      amount: parseFloat(item.totalAmount),
    }));

    res.status(200).json(formattedPaymentStats);

  } catch (error) {
    console.error('Error fetching payment method stats:', error);
    next(error);
  }
};
