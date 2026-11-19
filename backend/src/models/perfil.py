
import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from .usuario import Usuario
    from .rol import Rol


class Perfil(Base):
    __tablename__ = "perfiles"

    id_perfil: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    id_rol: Mapped[int] = mapped_column(
        ForeignKey("roles.id_rol", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    estado: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="activo",
    )

    id_usuario: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id_usuario", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    fecha_inicio: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    fecha_fin: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    usuarios: Mapped["Usuario"] = relationship(
        "Usuario",
        back_populates="perfiles",
    )

    roles: Mapped["Rol"] = relationship(
        "Rol",
        back_populates="perfiles",
    )
