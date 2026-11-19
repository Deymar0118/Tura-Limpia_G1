
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from .perfil import Perfil


class Rol(Base):
    __tablename__ = "roles"

    id_rol: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    nombre_rol: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    estado: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="activo",
    )

    perfiles: Mapped[list["Perfil"]] = relationship(
        "Perfil",
        back_populates="roles",
    )
