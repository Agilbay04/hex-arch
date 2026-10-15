'use strict';

const sports = [
  {
    id: '5f06b0e8-0ff0-4f6b-8f6a-1d5a827c0011',
    sportName: 'Badminton',
    iconText: 'Badminton',
  },
  {
    id: '5f06b0e8-0ff0-4f6b-8f6a-1d5a827c0012',
    sportName: 'Basket',
    iconText: 'Basket',
  },
  {
    id: '5f06b0e8-0ff0-4f6b-8f6a-1d5a827c0013',
    sportName: 'Futsal',
    iconText: 'Futsal',
  },
  {
    id: '5f06b0e8-0ff0-4f6b-8f6a-1d5a827c0014',
    sportName: 'Lari',
    iconText: 'Lari',
  },
  {
    id: '5f06b0e8-0ff0-4f6b-8f6a-1d5a827c0015',
    sportName: 'Renang',
    iconText: 'Renang',
  },
  {
    id: '5f06b0e8-0ff0-4f6b-8f6a-1d5a827c0016',
    sportName: 'Sepak Bola',
    iconText: 'Sepak-Bola',
  },
  {
    id: '5f06b0e8-0ff0-4f6b-8f6a-1d5a827c0017',
    sportName: 'Tenis',
    iconText: 'Tenis',
  },
  {
    id: '5f06b0e8-0ff0-4f6b-8f6a-1d5a827c0018',
    sportName: 'Bola Voli',
    iconText: 'Bola-Voli',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const sport of sports) {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM master_sport_types
           WHERE LOWER(sport_name) = LOWER(:sportName)
           LIMIT 1`,
          { replacements: { sportName: sport.sportName }, transaction },
        );

        if (existing.length > 0) continue;

        await queryInterface.sequelize.query(
          `INSERT INTO master_sport_types (
            id, created_by, created_date, updated_by, updated_date,
            deleted_by, deleted_date, sport_name, sport_icon_url,
            availability_type, is_active, is_kpi_eligible
          ) VALUES (
            :id, NULL, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP,
            NULL, NULL, :sportName, :sportIconUrl,
            'BOTH', TRUE, TRUE
          )`,
          {
            replacements: {
              id: sport.id,
              sportName: sport.sportName,
              sportIconUrl: `https://placehold.co/128x128/png?text=${sport.iconText}`,
            },
            transaction,
          },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const sport of sports) {
        await queryInterface.sequelize.query(
          'DELETE FROM master_sport_types WHERE id = :id',
          { replacements: { id: sport.id }, transaction },
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
