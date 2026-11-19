
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from .perfil import Perfil


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    id_barrio: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    nombres: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    apellidos: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    nombre_completo: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    nombre_usuario: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    correo: Mapped[str] = mapped_column(
        String,
        nullable=False,
        unique=True,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    telefono: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    documento: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    estado: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="activo",
    )

    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    es_superadministrador: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    perfiles: Mapped[list["Perfil"]] = relationship(
        "Perfil",
        back_populates="usuarios",
    )
