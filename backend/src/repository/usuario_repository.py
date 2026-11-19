
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.perfil import Perfil
from src.models.rol import Rol
from src.models.usuario import Usuario


class UsuarioRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_usuario(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        await self.db.commit()
        await self.db.refresh(usuario)
        return usuario

    async def find_usuario_by_email(
        self, email: str
    ) -> Optional[Usuario]:
        stmt = select(Usuario).where(
            Usuario.correo == email
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_usuario_by_id(
        self, usuario_id: UUID | str
    ) -> Optional[Usuario]:
        if isinstance(usuario_id, str):
            usuario_id = UUID(usuario_id)

        stmt = select(Usuario).where(
            Usuario.id_usuario == usuario_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_usuarios(self) -> list[Usuario]:
        stmt = select(Usuario).order_by(
            Usuario.nombres.asc(),
            Usuario.apellidos.asc(),
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_all_usuarios_paginated(
        self,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Usuario], int]:
        total_stmt = select(func.count()).select_from(Usuario)
        total_result = await self.db.execute(total_stmt)
        total = total_result.scalar_one()

        stmt = (
            select(Usuario)
            .order_by(
                Usuario.nombres.asc(),
                Usuario.apellidos.asc(),
            )
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(stmt)

        return result.scalars().all(), total

    async def update_usuario(self, usuario: Usuario) -> Usuario:
        await self.db.commit()
        await self.db.refresh(usuario)
        return usuario

    async def get_usuarios_count_by_rol(
        self,
    ) -> list[tuple[str, int]]:
        stmt = (
            select(
                Rol.nombre_rol,
                func.count(
                    func.distinct(Usuario.id_usuario)
                ).label("total_usuarios"),
            )
            .select_from(Rol)
            .outerjoin(Rol.perfiles)
            .outerjoin(Perfil.usuarios)
            .group_by(Rol.nombre_rol)
            .order_by(Rol.nombre_rol.asc())
        )

        result = await self.db.execute(stmt)
        return result.all()
