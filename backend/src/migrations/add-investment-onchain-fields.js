module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Investments', 'onChainInvestmentId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Investment ID from InvestmentContract',
    });
    
    await queryInterface.addColumn('Investments', 'onChainTxHash', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Transaction hash for on-chain investment recording',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Investments', 'onChainInvestmentId');
    await queryInterface.removeColumn('Investments', 'onChainTxHash');
  },
};
