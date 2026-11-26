
import uuid
from datetime import date, datetime

from sqlalchemy import (
    String,
    Boolean,
    Date,
    DateTime,
    Float,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base


class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id_vehiculo: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    tipo: Mapped[str] = mapped_column(String(50))

    placa: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        index=True,
    )

    num_interno: Mapped[str] = mapped_column(String(20))

    marca: Mapped[str] = mapped_column(String(50))

    modelo: Mapped[str] = mapped_column(String(50))

    capacidad_ton: Mapped[float] = mapped_column(Float)

    estado_operativo: Mapped[str] = mapped_column(
        String(30),
        default="operativo",
        server_default=text("'operativo'"),
    )

    fecha_adquisicion: Mapped[date] = mapped_column(Date)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        default=None,
    )
