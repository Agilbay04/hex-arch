'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `
          CREATE TYPE master_sport_types_availability_type
          AS ENUM ('ON_SITE', 'OFF_SITE', 'BOTH');
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE TABLE master_sport_types (
            id UUID PRIMARY KEY,
            created_by UUID NULL,
            created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_by UUID NULL,
            updated_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deleted_by UUID NULL,
            deleted_date TIMESTAMPTZ NULL,
            sport_name VARCHAR(100) NOT NULL,
            sport_icon_url TEXT NOT NULL,
            availability_type master_sport_types_availability_type NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            is_kpi_eligible BOOLEAN NOT NULL DEFAULT TRUE
          );
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE UNIQUE INDEX master_sport_types_sport_name_lower_uq
          ON master_sport_types (LOWER(sport_name));
        `,
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS master_sport_types;',
        { transaction },
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS master_sport_types_availability_type;',
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
