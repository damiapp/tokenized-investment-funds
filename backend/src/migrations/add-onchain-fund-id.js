module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Funds', 'onChainFundId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Fund ID from FundFactory contract',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Funds', 'onChainFundId');
  },
};
