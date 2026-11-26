
import re
from datetime import date, datetime

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
)


ANIO_MINIMO = 1980
ANIO_MAXIMO = date.today().year + 1
CAPACIDAD_MAXIMA_TON = 20


class VehiculoBase(BaseModel):
    tipo: str = Field(..., min_length=2, max_length=50)
    placa: str = Field(..., min_length=6, max_length=6)
    num_interno: str = Field(..., min_length=1, max_length=20)
    marca: str = Field(..., min_length=2, max_length=50)
    modelo: str = Field(..., min_length=1, max_length=50)

    anio_modelo: int = Field(
        ...,
        ge=ANIO_MINIMO,
        le=ANIO_MAXIMO,
    )

    ciudad_matricula: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    capacidad_ton: float = Field(
        ...,
        gt=0,
        le=CAPACIDAD_MAXIMA_TON,
    )

    estado_operativo: str = Field(
        default="operativo",
        max_length=30,
    )

    fecha_adquisicion: date

    @field_validator("placa")
    @classmethod
    def validar_placa(cls, valor: str) -> str:
        valor = valor.strip().upper().replace(" ", "")

        if not re.fullmatch(r"[A-Z]{3}[0-9]{3}", valor):
            raise ValueError(
                "Formato de placa inválido. "
                "Debe contener 3 letras seguidas de 3 números (AAA123)"
            )

        return valor

    @field_validator(
        "tipo",
        "num_interno",
        "marca",
        "modelo",
        "estado_operativo",
        "ciudad_matricula",
    )
    @classmethod
    def limpiar_textos(cls, valor: str) -> str:
        valor = valor.strip()

        if not valor:
            raise ValueError("Este campo no puede estar vacío")

        return valor


class VehiculoCreate(VehiculoBase):
    pass


class VehiculoUpdate(BaseModel):
    tipo: str | None = Field(default=None, min_length=2, max_length=50)
    placa: str | None = Field(default=None, min_length=6, max_length=6)
    num_interno: str | None = Field(default=None, min_length=1, max_length=20)
    marca: str | None = Field(default=None, min_length=2, max_length=50)
    modelo: str | None = Field(default=None, min_length=1, max_length=50)

    anio_modelo: int | None = Field(
        default=None,
        ge=ANIO_MINIMO,
        le=ANIO_MAXIMO,
    )

    ciudad_matricula: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    capacidad_ton: float | None = Field(
        default=None,
        gt=0,
        le=CAPACIDAD_MAXIMA_TON,
    )

    estado_operativo: str | None = Field(
        default=None,
        max_length=30,
    )

    fecha_adquisicion: date | None = None

    @field_validator("placa")
    @classmethod
    def validar_placa(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip().upper().replace(" ", "")

        if not re.fullmatch(r"[A-Z]{3}[0-9]{3}", valor):
            raise ValueError(
                "Formato de placa inválido. "
                "Debe contener 3 letras seguidas de 3 números (AAA123)"
            )

        return valor

    @field_validator(
        "tipo",
        "num_interno",
        "marca",
        "modelo",
        "estado_operativo",
        "ciudad_matricula",
    )
    @classmethod
    def limpiar_textos(
        cls,
        valor: str | None,
    ) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if not valor:
            raise ValueError("Este campo no puede estar vacío")

        return valor


class VehiculoStatusUpdate(BaseModel):
    is_active: bool


class VehiculoResponse(VehiculoBase):
    model_config = ConfigDict(from_attributes=True)

    id_vehiculo: str
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None
