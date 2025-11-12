from __future__ import annotations

from datetime import datetime
from typing import Dict

from sqlmodel import Session, select, delete

from app.models.practice import PracticeProgram, PracticeStep
from app.utils.practice_defaults import get_default_practice_programs


def seed_practice_programs(
    session: Session,
    overwrite: bool = False,
    clear_existing: bool = False,
) -> Dict[str, int]:
    created = 0
    updated = 0

    if clear_existing:
        session.exec(delete(PracticeStep))
        session.exec(delete(PracticeProgram))
        session.commit()

    existing_programs = {
        program.slug: program
        for program in session.exec(select(PracticeProgram)).all()
    }

    defaults = get_default_practice_programs()

    for payload in defaults:
        steps_payload = payload.pop("steps", [])
        slug = payload["slug"]
        program = existing_programs.get(slug)

        if program:
            if overwrite:
                for field, value in payload.items():
                    setattr(program, field, value)
                program.updated_at = datetime.utcnow()

                session.exec(
                    delete(PracticeStep).where(PracticeStep.program_id == program.id)
                )
                for step_data in steps_payload:
                    session.add(
                        PracticeStep(
                            program_id=program.id,
                            **step_data,
                        )
                    )
                session.add(program)
                updated += 1
        else:
            new_program = PracticeProgram(**payload)
            session.add(new_program)
            session.flush()

            for step_data in steps_payload:
                session.add(
                    PracticeStep(
                        program_id=new_program.id,
                        **step_data,
                    )
                )
            created += 1

    session.commit()
    return {"created": created, "updated": updated}
