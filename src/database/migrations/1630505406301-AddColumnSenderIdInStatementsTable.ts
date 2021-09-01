import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export class AddColumnSenderIdInStatementsTable1630505406301 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn('statements', new TableColumn({
        name: 'sender_id',
        type: 'uuid',
        isNullable: true,
      }));

      await queryRunner.createForeignKey('statements', new TableForeignKey({
        name: 'FKUserSender',
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        columnNames: ['sender_id'],
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL'
      }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropForeignKey('statements', 'FKUserSender')
      await queryRunner.dropColumn('statements', 'sender_id');
    }

}
