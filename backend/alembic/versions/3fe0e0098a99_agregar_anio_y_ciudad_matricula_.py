
"""agregar_anio_y_ciudad_matricula_vehiculos

Revision ID: 3fe0e0098a99
Revises: 85d5a6a58cbf
Create Date: 2026-11-25 23:02:06.160636
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3fe0e0098a99"
down_revision: Union[str, Sequence[str], None] = "85d5a6a58cbf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agregar las columnas inicialmente permitiendo valores nulos.
    op.add_column(
        "vehiculos",
        sa.Column("anio_modelo", sa.Integer(), nullable=True),
    )

    op.add_column(
        "vehiculos",
        sa.Column("ciudad_matricula", sa.String(length=100), nullable=True),
    )

    # Completar los datos del vehículo de prueba existente.
    op.execute(
        """
        UPDATE vehiculos
        SET
            anio_modelo = 2024,
            ciudad_matricula = 'Buenaventura'
        WHERE anio_modelo IS NULL
           OR ciudad_matricula IS NULL
        """
    )

    # Convertir las columnas en obligatorias.
    op.alter_column(
        "vehiculos",
        "anio_modelo",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.alter_column(
        "vehiculos",
        "ciudad_matricula",
        existing_type=sa.String(length=100),
        nullable=False,
    )

    # Agregar la restricción de capacidad.
    op.create_check_constraint(
        "ck_vehiculos_capacidad_ton_rango",
        "vehiculos",
        "capacidad_ton > 0 AND capacidad_ton <= 20",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_vehiculos_capacidad_ton_rango",
        "vehiculos",
        type_="check",
    )

    op.drop_column("vehiculos", "ciudad_matricula")
    op.drop_column("vehiculos", "anio_modelo")
