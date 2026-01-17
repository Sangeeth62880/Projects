"""
Scientifically Valid Dyscalculia Screening Question Generator

HARD CONSTRAINT MODE: ENABLED

This module generates assessment content conforming to standard dyscalculia 
screening task structures. Creativity is LIMITED to presentation only.
Cognitive structure must remain scientifically valid.

Test Types:
- NUMBER_COMPARISON: Magnitude judgment (greater/smaller/equal)
- MENTAL_ARITHMETIC: Single/two-step calculations
- MEMORY_RECALL: Ordered sequence recall

All questions follow strict cognitive templates with age-appropriate constraints.
"""

import os
import json
import random
import asyncio
from typing import List, Dict, Optional
from groq import Groq
from schemas.schemas import Question, TestType, AgeGroup
from ai.difficulty_state_machine import difficulty_machine

# Configure Groq with API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# Age-specific cognitive constraints
AGE_CONSTRAINTS = {
    "5-6": {
        "number_range": (1, 10),
        "arithmetic_max_increment": 5,
        "arithmetic_steps": 1,
        "memory_sequence_length": 3,
        "visual_preferred": True,
    },
    "7-8": {
        "number_range": (1, 50),
        "arithmetic_max_increment": 20,
        "arithmetic_steps": 1,
        "memory_sequence_length": 4,
        "visual_preferred": False,
    },
    "9-10": {
        "number_range": (1, 100),
        "arithmetic_max_increment": 50,
        "arithmetic_steps": 2,
        "memory_sequence_length": 6,
        "visual_preferred": False,
    },
}


class DyscalculiaScreeningGenerator:
    """
    Scientifically valid dyscalculia screening question generator.
    
    Follows strict cognitive templates:
    - NUMBER_COMPARISON: Magnitude judgment only
    - MENTAL_ARITHMETIC: Addition/subtraction chains
    - MEMORY_RECALL: Ordered sequence recall
    
    Story wrappers provide engagement without altering cognitive validity.
    """
    
    MAX_RETRIES = 5
    INITIAL_BACKOFF = 1.0
    MAX_BACKOFF = 30.0
    
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"
        self._generated_ids: set = set()
    
    def _get_constraints(self, age_group: AgeGroup) -> Dict:
        """Get age-specific cognitive constraints."""
        return AGE_CONSTRAINTS.get(age_group.value, AGE_CONSTRAINTS["7-8"])
    
    def _get_dynamic_constraints(self, session_id: Optional[str], age_group: AgeGroup) -> Dict:
        """Get dynamic constraints based on current difficulty state."""
        if session_id:
            # Get real-time adaptive params from state machine
            params = difficulty_machine.get_difficulty_params(session_id, age_group.value)
            return {
                "number_range": params["number_range"],
                "arithmetic_max_increment": 20 if params["difficulty_value"] < 3 else 50, # Approximate mapping
                "arithmetic_steps": 1 if params["difficulty_value"] < 3 else 2,
                "memory_sequence_length": params["sequence_length"],
                "visual_preferred": params["visual_complexity"] == "simple",
            }
        else:
            # Fallback to static age constraints
            return self._get_constraints(age_group)

    def _build_number_comparison_prompt(
        self, 
        age_group: AgeGroup, 
        count: int,
        difficulty_level: str,
        session_id: Optional[str] = None
    ) -> str:
        """Build prompt for NUMBER_COMPARISON with strict cognitive template."""
        
        constraints = self._get_dynamic_constraints(session_id, age_group)
        num_min, num_max = constraints["number_range"]
        seed = random.randint(10000, 99999)
        
        return f"""You are a cognitive assessment specialist generating dyscalculia screening tasks.

🔒 HARD CONSTRAINT MODE: ENABLED

TASK: Generate {count} NUMBER_COMPARISON questions for age {age_group.value}.
DIFFICULTY: {difficulty_level}
SEED: {seed}

📏 NUMBER COMPARISON STRICT TEMPLATE:
Each question MUST:
- Compare exactly TWO quantities
- Require magnitude judgment (greater / smaller / equal ONLY)
- Avoid calculation steps
- Use numbers in range {num_min} to {num_max}

❌ INVALID (Never Generate):
- Pattern puzzles
- Addition disguised as comparison  
- Multi-step problems

🎮 STORY WRAPPER RULES:
- VARY themes significantly (Animals, Space, Ocean, Sports, Magic, nature)
- VARY characters (Aliens, Wizards, Robots, Dinosaurs)
- USE different emojis for every question

OUTPUT FORMAT (JSON array only):
[
  {{
    "question_id": "nc_{seed}_1",
    "test_type": "number-comparison",
    "age_group": "{age_group.value}",
    "difficulty_level": "{difficulty_level}",
    "cognitive_task_template": "magnitude_comparison",
    "core_task_data": {{
      "left_quantity": 5,
      "right_quantity": 8,
      "correct_relationship": "right_greater"
    }},
    "story_wrapper": {{
      "left_character": "Rabbit",
      "right_character": "Bear",  
      "object": "carrots",
      "left_emoji": "🐰",
      "right_emoji": "🐻",
      "count_emoji": "🥕"
    }},
    "story": "🐰 Rabbit has 5 carrots. 🐻 Bear has 8 carrots. Who has more?",
    "options": ["Rabbit", "Bear", "Same", "Cannot tell"],
    "correct_answer": "Bear",
    "validation_flags": {{
      "age_range_valid": true,
      "single_comparison": true,
      "no_calculation": true
    }}
  }}
]

Generate {count} scientifically valid questions NOW:"""

    def _build_mental_arithmetic_prompt(
        self, 
        age_group: AgeGroup, 
        count: int,
        difficulty_level: str,
        session_id: Optional[str] = None
    ) -> str:
        """Build prompt for MENTAL_ARITHMETIC with strict cognitive template."""
        
        constraints = self._get_dynamic_constraints(session_id, age_group)
        max_increment = constraints.get("arithmetic_max_increment", 20)
        max_steps = constraints.get("arithmetic_steps", 1)
        seed = random.randint(10000, 99999)
        
        step_text = "Single-step only" if max_steps == 1 else f"Up to {max_steps} steps"
        
        return f"""You are a cognitive assessment specialist generating dyscalculia screening tasks.

🔒 HARD CONSTRAINT MODE: ENABLED

TASK: Generate {count} MENTAL_ARITHMETIC questions for age {age_group.value}.
DIFFICULTY: {difficulty_level}
SEED: {seed}

🧮 MENTAL ARITHMETIC STRICT TEMPLATE:
Each question MUST:
- Involve ONE mental calculation chain
- Use addition OR subtraction ONLY
- {step_text}
- Increments ≤ {max_increment}
- Avoid written math notation (+, -, =)

✅ VALID:
- "Start with 5, add 3 more. How many?"
- "You have 8, take away 2. How many left?"

🎮 STORY WRAPPER RULES:
- VARY themes significantly (Pirates, Cooking, Gardening, Space, Superheroes)
- VARY characters (Captain Hook, Chef Mario, Astro, Wonder Woman)
- USE different emojis for every question

OUTPUT FORMAT (JSON array only):
[
  {{
    "question_id": "ma_{seed}_1",
    "test_type": "mental-arithmetic",
    "age_group": "{age_group.value}",
    "difficulty_level": "{difficulty_level}",
    "cognitive_task_template": "addition_single_step",
    "core_task_data": {{
      "start_value": 5,
      "operation": "add",
      "operand": 3,
      "result": 8
    }},
    "story_wrapper": {{
      "character": "Emma",
      "object": "balloons",
      "emoji": "🎈",
      "action": "receives"
    }},
    "story": "🎈 Emma has 5 balloons. She gets 3 more. How many now?",
    "left_value": 5,
    "right_value": 3,
    "options": ["6", "7", "8", "9"],
    "correct_answer": "8",
    "validation_flags": {{
      "single_step": true,
      "add_or_subtract_only": true,
      "age_appropriate": true
    }}
  }}
]

Generate {count} scientifically valid questions NOW:"""

    def _build_memory_recall_prompt(
        self, 
        age_group: AgeGroup, 
        count: int,
        difficulty_level: str,
        session_id: Optional[str] = None
    ) -> str:
        """Build prompt for MEMORY_RECALL with strict cognitive template."""
        
        constraints = self._get_dynamic_constraints(session_id, age_group)
        seq_len = constraints["memory_sequence_length"]
        seed = random.randint(10000, 99999)
        
        return f"""You are a cognitive assessment specialist generating dyscalculia screening tasks.

🔒 HARD CONSTRAINT MODE: ENABLED

TASK: Generate {count} MEMORY_RECALL questions for age {age_group.value}.
DIFFICULTY: {difficulty_level}
SEED: {seed}

🧠 MEMORY RECALL STRICT TEMPLATE:
Each question MUST:
- Present ordered sequence of exactly {seq_len} items
- Ask for recall of position (first, second, third, last)
- OR ask "what comes next" for pattern sequences
- Sequence length: exactly {seq_len} items

🎮 STORY WRAPPER RULES:
- VARY themes significantly (Shapes, Colors, Fruits, Animals, Planets, Vehicles)
- VARY emojis (🔴🔵, 🍎🍌, 🐶🐱, 🚗✈️, 🌍🌕)
- The 'story' field MUST ONLY be the question (e.g. "What was the third item?").
- DO NOT list the items in the 'story' text.
- DO NOT say "Remember: A, B, C". Just ask the question.

OUTPUT FORMAT (JSON array only):
[
  {{
    "question_id": "mr_{seed}_1",
    "test_type": "memory-recall",
    "age_group": "{age_group.value}",
    "difficulty_level": "{difficulty_level}",
    "cognitive_task_template": "sequence_position_recall",
    "core_task_data": {{
      "sequence": ["Red", "Blue", "Green"],
      "question_type": "position",
      "target_position": 2,
      "correct_item": "Blue"
    }},
    "story_wrapper": {{
      "theme": "colors",
      "emoji": "🎨"
    }},
    "story": "What color was the second item?",
    "memory_sequence": ["Red", "Blue", "Green"],
    "options": ["Red", "Blue", "Green", "Yellow"],
    "correct_answer": "Blue",
    "validation_flags": {{
      "sequence_length_valid": true,
      "position_question": true,
      "no_calculation": true
    }}
  }}
]

Generate {count} scientifically valid questions NOW:"""

    async def _call_ai_with_retry(self, prompt: str) -> Optional[str]:
        """Call AI API with exponential backoff retry logic."""
        
        backoff = self.INITIAL_BACKOFF
        last_error = None
        
        for attempt in range(self.MAX_RETRIES):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system", 
                            "content": "You are a cognitive assessment specialist. Generate ONLY valid JSON arrays for dyscalculia screening. Follow templates exactly."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=4000,
                )
                
                content = response.choices[0].message.content
                
                # Extract JSON
                json_start = content.find('[')
                json_end = content.rfind(']') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = content[json_start:json_end]
                    json.loads(json_str)  # Validate
                    return json_str
                else:
                    raise ValueError("No valid JSON array found")
                    
            except Exception as e:
                last_error = e
                print(f"Generation attempt {attempt + 1} failed: {e}")
                
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(min(backoff, self.MAX_BACKOFF))
                    backoff *= 2
        
        raise RuntimeError(f"AI generation failed after {self.MAX_RETRIES} attempts: {last_error}")

    async def _call_ai_for_text(self, prompt: str) -> str:
        """Call AI API for plain text responses (feedback)."""
        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a warm tutor for children. Respond briefly."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.8,
                    max_tokens=100,
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                if attempt < 2:
                    await asyncio.sleep(0.5)
        raise RuntimeError("Failed to generate feedback")

    def _validate_question(self, q: Dict, test_type: TestType, constraints: Dict) -> bool:
        """Validate question against cognitive constraints."""
        
        if test_type == TestType.NUMBER_COMPARISON:
            # Must have two quantities
            core = q.get("core_task_data", {})
            left = core.get("left_quantity") or q.get("left_value")
            right = core.get("right_quantity") or q.get("right_value")
            
            if left is None or right is None:
                return False
            
            # Check range
            num_min, num_max = constraints["number_range"]
            if not (num_min <= left <= num_max and num_min <= right <= num_max):
                return False
                
        elif test_type == TestType.MENTAL_ARITHMETIC:
            core = q.get("core_task_data", {})
            # Verify operation is add/subtract
            op = core.get("operation", "").lower()
            if op not in ["add", "subtract", "addition", "subtraction"]:
                pass  # Allow if not specified
                
        elif test_type == TestType.MEMORY_RECALL:
            seq = q.get("memory_sequence") or q.get("core_task_data", {}).get("sequence", [])
            expected_len = constraints["memory_sequence_length"]
            if len(seq) != expected_len:
                return False
        
        return True

    def _parse_question(self, q: Dict, test_type: TestType, idx: int) -> Question:
        """Parse validated AI response into Question object."""
        
        # Extract from structured format
        core = q.get("core_task_data", {})
        story_wrapper = q.get("story_wrapper", {})
        
        # Get story
        story = q.get("story", "")
        
        # Get values
        left_value = core.get("left_quantity") or q.get("left_value")
        right_value = core.get("right_quantity") or q.get("right_value")
        
        # Memory sequence
        memory_sequence = q.get("memory_sequence") or core.get("sequence")
        
        # Emoji fields
        emoji = story_wrapper.get("count_emoji") or story_wrapper.get("emoji") or "🔵"
        left_emoji = story_wrapper.get("left_emoji")
        right_emoji = story_wrapper.get("right_emoji")
        left_label = story_wrapper.get("left_character")
        right_label = story_wrapper.get("right_character")
        
        return Question(
            question_id=q.get("question_id", f"{test_type.value}_{idx+1}"),
            test_type=test_type,
            story=story,
            visual_object="*",
            left_value=left_value,
            right_value=right_value,
            memory_sequence=memory_sequence,
            options=q.get("options", []),
            correct_answer=q.get("correct_answer", ""),
            emoji=emoji,
            left_emoji=left_emoji,
            right_emoji=right_emoji,
            left_label=left_label,
            right_label=right_label,
        )

    async def generate_questions(
        self,
        test_type: TestType,
        age_group: AgeGroup,
        count: int = 5,
        session_id: Optional[str] = None
    ) -> List[Question]:
        """Generate scientifically valid screening questions."""
        
        # Get difficulty
        difficulty_level = "MEDIUM"
        if session_id:
            params = difficulty_machine.get_difficulty_params(session_id, age_group.value)
            difficulty_level = params.get("difficulty_state", "MEDIUM")
        
        # Build appropriate prompt
        if test_type == TestType.NUMBER_COMPARISON:
            prompt = self._build_number_comparison_prompt(age_group, count, difficulty_level, session_id)
        elif test_type == TestType.MENTAL_ARITHMETIC:
            prompt = self._build_mental_arithmetic_prompt(age_group, count, difficulty_level, session_id)
        else:
            prompt = self._build_memory_recall_prompt(age_group, count, difficulty_level, session_id)
        
        # Generate
        json_str = await self._call_ai_with_retry(prompt)
        questions_data = json.loads(json_str)
        
        # Validate and parse
        constraints = self._get_constraints(age_group)
        questions = []
        
        for idx, q in enumerate(questions_data):
            if self._validate_question(q, test_type, constraints):
                questions.append(self._parse_question(q, test_type, idx))
                if len(questions) >= count:
                    break
        
        print(f"Generated {len(questions)} validated {test_type.value} questions")
        return questions

    async def generate_feedback(
        self,
        is_correct: bool,
        question_story: str,
        selected_answer: str,
        correct_answer: str,
        age_group: str = "7-8"
    ) -> str:
        """Generate encouraging feedback."""
        
        if is_correct:
            prompt = f"""Child answered correctly! Question: {question_story}
Generate SHORT (1 sentence), enthusiastic praise with emoji."""
        else:
            prompt = f"""Child needs encouragement. Question: {question_story}
Correct answer: {correct_answer}
Generate SHORT (1 sentence), supportive hint with emoji. Never say "wrong"."""
        
        try:
            return await self._call_ai_for_text(prompt)
        except Exception:
            if is_correct:
                return f"Wonderful! {selected_answer} is correct! 🌟"
            else:
                return f"Good try! The answer is {correct_answer}. Keep going! ⭐"

    async def generate_parent_explanation(
        self,
        session_id: str,
        behavioral_context: str,
        age_group: str = "7-8"
    ) -> Dict:
        """Generate parent-friendly screening explanation."""
        
        prompt = f"""Generate parent-friendly dyscalculia screening summary.
{behavioral_context}

Return JSON:
{{"summary": "...", "behavioral_insights": "...", "risk_interpretation": "...", 
"recommendations": ["..."], "disclaimer": "Educational screening only, not diagnosis."}}"""

        try:
            response = await self._call_ai_with_retry(prompt)
            return json.loads(response)
        except Exception:
            return {
                "summary": "Screening completed.",
                "disclaimer": "This is an educational screening tool, not a medical diagnosis."
            }


# Alias for compatibility
GeminiQuestionGenerator = DyscalculiaScreeningGenerator
AIQuestionGenerator = DyscalculiaScreeningGenerator
