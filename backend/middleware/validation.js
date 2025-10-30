// Validation middleware
const validateItem = (req, res, next) => {
  const { item_name, category, quantity, reorder_level, unit_price } = req.body;
  const errors = [];

  if (!item_name || item_name.trim() === '') {
    errors.push('Item name is required');
  }

  if (!category || category.trim() === '') {
    errors.push('Category is required');
  }

  if (quantity === undefined || quantity === null) {
    errors.push('Quantity is required');
  } else if (isNaN(quantity) || quantity < 0) {
    errors.push('Quantity must be a non-negative number');
  }

  if (reorder_level === undefined || reorder_level === null) {
    errors.push('Reorder level is required');
  } else if (isNaN(reorder_level) || reorder_level < 0) {
    errors.push('Reorder level must be a non-negative number');
  }

  if (unit_price !== undefined && unit_price !== null) {
    if (isNaN(unit_price) || unit_price < 0) {
      errors.push('Unit price must be a non-negative number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateTransaction = (req, res, next) => {
  const { item_id, transaction_type, quantity } = req.body;
  const errors = [];

  if (!item_id) {
    errors.push('Item ID is required');
  }

  if (!transaction_type || !['IN', 'OUT'].includes(transaction_type)) {
    errors.push('Transaction type must be either IN or OUT');
  }

  if (!quantity || isNaN(quantity) || quantity <= 0) {
    errors.push('Quantity must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateId = (req, res, next) => {
  const id = req.params.id;
  
  if (!id || isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }

  next();
};

module.exports = {
  validateItem,
  validateTransaction,
  validateId
};