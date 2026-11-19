
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.perfil import Perfil
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.perfil import Perfil


class PerfilRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_perfil(self, perfil: Perfil) -> Perfil:
        self.db.add(perfil)
        await self.db.commit()
        await self.db.refresh(perfil)
        return perfil

    async def find_perfil(
        self, user_id: str, role_id: str
    ) -> Optional[Perfil]:
        stmt = select(Perfil).where(
            Perfil.usuario_id == user_id,
            Perfil.rol_id == role_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_profile_status(
        self,
        user_id: str,
        role_id: str,
        is_active: bool
    ) -> Optional[Perfil]:
        perfil = await self.find_perfil(user_id, role_id)

        if perfil:
            perfil.is_active = is_active
            await self.db.commit()
            await self.db.refresh(perfil)

        return perfil

    async def deactivate_all_by_user(self, user_id: str) -> bool:
        stmt = (
            update(Perfil)
            .where(Perfil.usuario_id == user_id)
            .values(is_active=False)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount > 0

    async def delete_perfil(
        self, user_id: str, role_id: str
    ) -> bool:
        perfil = await self.find_perfil(user_id, role_id)

        if perfil:
            await self.db.delete(perfil)
            await self.db.commit()
            return True

        return False



class PerfilRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_perfil(self, perfil: Perfil) -> Perfil:
        self.db.add(perfil)
        await self.db.commit()
        await self.db.refresh(perfil)
        return perfil

    async def find_perfil(
        self,
        user_id: UUID | str,
        role_id: int,
    ) -> Optional[Perfil]:

        if isinstance(user_id, str):
            user_id = UUID(user_id)

        stmt = select(Perfil).where(
            Perfil.id_usuario == user_id,
            Perfil.id_rol == role_id,
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_profile_status(
        self,
        user_id: UUID | str,
        role_id: int,
        is_active: bool,
    ) -> Optional[Perfil]:

        perfil = await self.find_perfil(user_id, role_id)

        if perfil:
            perfil.estado = "activo" if is_active else "inactivo"
            await self.db.commit()
            await self.db.refresh(perfil)

        return perfil

    async def deactivate_all_by_user(
        self,
        user_id: UUID | str,
    ) -> bool:

        if isinstance(user_id, str):
            user_id = UUID(user_id)

        stmt = (
            update(Perfil)
            .where(Perfil.id_usuario == user_id)
            .values(estado="inactivo")
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount > 0

    async def delete_perfil(
        self,
        user_id: UUID | str,
        role_id: int,
    ) -> bool:

        perfil = await self.find_perfil(user_id, role_id)

        if perfil:
            await self.db.delete(perfil)
            await self.db.commit()
            return True

        return False
