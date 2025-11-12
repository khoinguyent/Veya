#!/usr/bin/env python3
"""
Example script to add new goals to "What brings you here" section.
Usage:
    python scripts/add_goal_example.py
"""

import requests
import sys
import os

# API configuration
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api")
# Get token from environment or prompt
TOKEN = os.getenv("JWT_TOKEN", "")

if not TOKEN:
    print("Error: JWT_TOKEN environment variable not set")
    print("Please set it with: export JWT_TOKEN='your_token_here'")
    print("Or pass it when running: JWT_TOKEN='your_token' python scripts/add_goal_example.py")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}


def add_goal(code: str, label: str, emoji: str = None, description: str = None, display_order: int = 0):
    """Add a new goal template."""
    goal_data = {
        "code": code,
        "label": label,
        "display_order": display_order,
        "is_active": True
    }
    
    if emoji:
        goal_data["emoji"] = emoji
    if description:
        goal_data["description"] = description
    
    response = requests.post(
        f"{API_BASE}/admin/templates/goals",
        headers=headers,
        json=goal_data
    )
    
    if response.status_code == 201:
        print(f"✅ Successfully added: {label} ({code})")
        return response.json()
    else:
        print(f"❌ Error adding {label}: {response.status_code}")
        print(f"   Response: {response.text}")
        return None


def main():
    """Add example goals."""
    print("Adding new goals to 'What brings you here' section...")
    print(f"API Base: {API_BASE}\n")
    
    # Example goals to add
    new_goals = [
        {
            "code": "increase_energy",
            "label": "Increase energy",
            "emoji": "⚡",
            "description": "Boost daily energy levels",
            "display_order": 5
        },
        {
            "code": "improve_sleep_quality",
            "label": "Improve sleep quality",
            "emoji": "🌙",
            "description": "Get better quality sleep",
            "display_order": 6
        },
        {
            "code": "reduce_anxiety",
            "label": "Reduce anxiety",
            "emoji": "😌",
            "description": "Manage and reduce anxiety levels",
            "display_order": 7
        },
        {
            "code": "build_confidence",
            "label": "Build confidence",
            "emoji": "💪",
            "description": "Increase self-confidence and self-esteem",
            "display_order": 8
        },
        {
            "code": "enhance_creativity",
            "label": "Enhance creativity",
            "emoji": "🎨",
            "description": "Boost creative thinking and innovation",
            "display_order": 9
        },
    ]
    
    results = []
    for goal in new_goals:
        result = add_goal(**goal)
        results.append(result)
    
    print(f"\n✅ Completed! Added {len([r for r in results if r])} goal(s)")
    
    # Verify by fetching all goals
    print("\nFetching all goals to verify...")
    response = requests.get(f"{API_BASE}/templates/goals", headers={"Authorization": f"Bearer {TOKEN}"})
    if response.status_code == 200:
        goals = response.json()
        print(f"\nTotal active goals: {len(goals)}")
        for goal in goals:
            print(f"  - {goal.get('emoji', '')} {goal.get('label')} ({goal.get('code')})")


if __name__ == "__main__":
    main()

