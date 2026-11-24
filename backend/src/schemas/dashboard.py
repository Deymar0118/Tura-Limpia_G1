
from pydantic import BaseModel


class DashboardResumenResponse(BaseModel):
    total: int
    activos: int
    inactivos: int
