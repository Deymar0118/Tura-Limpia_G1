
"""agregar valores predeterminados a vehiculos

Revision ID: 85d5a6a58cbf
Revises: 79f1e5febdf2
Create Date: 2026-11-25 21:41:53.304179

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85d5a6a58cbf'
down_revision: Union[str, Sequence[str], None] = '79f1e5febdf2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'vehiculos',
        'estado_operativo',
        existing_type=sa.String(length=30),
        existing_nullable=False,
        server_default=sa.text("'operativo'"),
    )

    op.alter_column(
        'vehiculos',
        'is_active',
        existing_type=sa.Boolean(),
        existing_nullable=False,
        server_default=sa.text('true'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'vehiculos',
        'is_active',
        existing_type=sa.Boolean(),
        existing_nullable=False,
        server_default=None,
    )

    op.alter_column(
        'vehiculos',
        'estado_operativo',
        existing_type=sa.String(length=30),
        existing_nullable=False,
        server_default=None,
    )
