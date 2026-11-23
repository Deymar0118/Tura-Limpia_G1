
from src.repository import UsuarioRepository


class DashboardService:
    def __init__(self, usuario_repository: UsuarioRepository):
        self.usuario_repository = usuario_repository

    async def obtener_resumen(self) -> dict[str, int]:
        return await self.usuario_repository.get_usuarios_count_by_estado()
