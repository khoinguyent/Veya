from __future__ import annotations

from dataclasses import dataclass
from datetime import time
from typing import List, Optional


@dataclass(frozen=True)
class GreetingTheme:
    id: str
    start_hour: int
    end_hour: int
    title: str
    subtitle: str
    icon: str
    card_color: str
    highlight_color: str
    accent_color: str
    text_primary: str
    text_secondary: str

    def matches(self, hour: int) -> bool:
        if self.start_hour <= self.end_hour:
            return self.start_hour <= hour < self.end_hour
        # handle overnight wrap (e.g. 21-24,0-4)
        return hour >= self.start_hour or hour < self.end_hour


GREETING_THEMES: List[GreetingTheme] = [
    GreetingTheme(
        id="sunrise",
        start_hour=5,
        end_hour=11,
        title="Good morning",
        subtitle="Start your day grounded",
        icon="sunrise",
        card_color="#E4EFE6",
        highlight_color="#F2F8F3",
        accent_color="#5C8B70",
        text_primary="#3F5A4B",
        text_secondary="#6B826F",
    ),
    GreetingTheme(
        id="daylight",
        start_hour=11,
        end_hour=17,
        title="Good afternoon",
        subtitle="Pause for a mindful moment",
        icon="sun",
        card_color="#FFF4E2",
        highlight_color="#FFF9EE",
        accent_color="#D08433",
        text_primary="#704C1A",
        text_secondary="#8C6740",
    ),
    GreetingTheme(
        id="twilight",
        start_hour=17,
        end_hour=21,
        title="Good evening",
        subtitle="Unwind and reflect gently",
        icon="sunset",
        card_color="#F4ECFF",
        highlight_color="#F8F2FF",
        accent_color="#7A5DA1",
        text_primary="#4A3E68",
        text_secondary="#7D6B97",
    ),
    GreetingTheme(
        id="night",
        start_hour=21,
        end_hour=5,
        title="Good night",
        subtitle="Rest and restore your energy",
        icon="moon",
        card_color="#0F172A",
        highlight_color="#1E293B",
        accent_color="#38BDF8",
        text_primary="#E2E8F0",
        text_secondary="#94A3B8",
    ),
]


def select_greeting(hour: int) -> GreetingTheme:
    for theme in GREETING_THEMES:
        if theme.matches(hour):
            return theme
    return GREETING_THEMES[-1]
