"""
Script to run Alembic database migrations.
This automatically applies all pending migrations to bring the database up to date.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import subprocess
import os


def run_migrations():
    """Run Alembic migrations to update database schema."""
    print("=" * 60)
    print("Running Database Migrations")
    print("=" * 60)
    
    try:
        # Run alembic upgrade head
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=False,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Migrations applied successfully!")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print("⚠️  Migration output:")
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        return False


if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)

