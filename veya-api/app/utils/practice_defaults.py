from __future__ import annotations

from typing import Any, Dict, List


def get_default_practice_programs() -> List[Dict[str, Any]]:
    return [
        {
            "slug": "5-day-meditation-starter",
            "title": "5-Day Meditation Starter",
            "short_description": "A gentle introduction to daily meditation fundamentals",
            "category": "meditation",
            "level": "beginner",
            "duration_days": 5,
            "tags": ["meditation", "starter", "mindfulness"],
            "steps": [
                {"order_index": 1, "title": "Day 1: Mindful Breathing"},
                {"order_index": 2, "title": "Day 2: Body Scan"},
                {"order_index": 3, "title": "Day 3: Noticing Emotions"},
                {"order_index": 4, "title": "Day 4: Loving Kindness"},
                {"order_index": 5, "title": "Day 5: Open Awareness"},
            ],
        },
        {
            "slug": "5-day-nature-mindfulness",
            "title": "5-Day Nature Mindfulness",
            "short_description": "Ground yourself through sensory-based nature practices",
            "category": "mindfulness",
            "level": "all-levels",
            "duration_days": 5,
            "tags": ["nature", "mindfulness", "outdoors"],
            "steps": [
                {"order_index": 1, "title": "Day 1: Noticing Nature Sounds"},
                {"order_index": 2, "title": "Day 2: Seeing Detail in Plants"},
                {"order_index": 3, "title": "Day 3: Feeling the Ground"},
                {"order_index": 4, "title": "Day 4: Cloud Watching & Reflection"},
                {"order_index": 5, "title": "Day 5: Walk with Intention"},
            ],
        },
        {
            "slug": "7-day-breathwork-journey",
            "title": "7-Day Breathwork Journey",
            "short_description": "Explore foundational breath techniques for balance and energy",
            "category": "breathwork",
            "level": "intermediate",
            "duration_days": 7,
            "tags": ["breathwork", "breathing", "relaxation"],
            "steps": [
                {"order_index": 1, "title": "Day 1: Diaphragmatic Breathing"},
                {"order_index": 2, "title": "Day 2: Box Breathing"},
                {"order_index": 3, "title": "Day 3: 4-7-8 Breathing"},
                {"order_index": 4, "title": "Day 4: Alternate Nostril Breathing"},
                {"order_index": 5, "title": "Day 5: Energizing Breath"},
                {"order_index": 6, "title": "Day 6: Relaxation Breath Practice"},
                {"order_index": 7, "title": "Day 7: Integrating Breath Awareness"},
            ],
        },
        {
            "slug": "10-day-nature-connection",
            "title": "10-Day Nature Connection",
            "short_description": "Deepen your sense of belonging with the natural world",
            "category": "nature",
            "level": "all-levels",
            "duration_days": 10,
            "tags": ["nature", "connection", "gratitude"],
            "steps": [
                {"order_index": 1, "title": "Day 1: Mindful Observation Outdoors"},
                {"order_index": 2, "title": "Day 2: Texture & Touch"},
                {"order_index": 3, "title": "Day 3: Animal Presence"},
                {"order_index": 4, "title": "Day 4: Listening Deeply to Nature"},
                {"order_index": 5, "title": "Day 5: Sunlight & Shadows"},
                {"order_index": 6, "title": "Day 6: Water Meditation"},
                {"order_index": 7, "title": "Day 7: Mindful Walking"},
                {"order_index": 8, "title": "Day 8: Nature Sketch or Photo"},
                {"order_index": 9, "title": "Day 9: Outdoor Gratitude"},
                {"order_index": 10, "title": "Day 10: “Thank You, Nature” Reflection"},
            ],
        },
    ]
