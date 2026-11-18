import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  // ── CREATE ──────────────────────────────────────────────
  // Asks for content + priority, then saves to DynamoDB via AppSync
  function createTodo() {
    const content = window.prompt("What is the todo?");
    if (!content) return;

    const rawPriority = window.prompt("Priority? Type: LOW  MEDIUM  or  HIGH");
    const priority =
      rawPriority === "LOW" || rawPriority === "MEDIUM" || rawPriority === "HIGH"
        ? rawPriority
        : "LOW"; // default to LOW if invalid input

    client.models.Todo.create({
      content,
      priority,
      isDone: false, // always starts as not done
    });
  }

  // ── TOGGLE DONE ─────────────────────────────────────────
  // Flips isDone true/false and saves to DynamoDB
  function toggleDone(todo: Schema["Todo"]["type"]) {
    client.models.Todo.update({
      id: todo.id,
      isDone: !todo.isDone,
    });
  }

  // ── DELETE ──────────────────────────────────────────────
  // Removes the item from DynamoDB completely
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  // Priority badge colour so we can see difference visually
  function priorityColor(p: string | null | undefined) {
    if (p === "HIGH") return "red";
    if (p === "MEDIUM") return "orange";
    return "green"; // LOW or null
  }

  return (
    <main style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>📝 My Todos</h1>

      <button
        onClick={createTodo}
        style={{ padding: "8px 16px", fontSize: 16, cursor: "pointer" }}
      >
        + Add Todo
      </button>

      <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid #eee",
              textDecoration: todo.isDone ? "line-through" : "none",
              opacity: todo.isDone ? 0.5 : 1,
            }}
          >
            {/* Checkbox — clicking this calls toggleDone → DynamoDB update */}
            <input
              type="checkbox"
              checked={todo.isDone ?? false}
              onChange={() => toggleDone(todo)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />

            {/* Priority badge */}
            <span
              style={{
                background: priorityColor(todo.priority),
                color: "white",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: "bold",
                minWidth: 50,
                textAlign: "center",
              }}
            >
              {todo.priority ?? "LOW"}
            </span>

            {/* Todo content text */}
            <span style={{ flex: 1 }}>{todo.content}</span>

            {/* Delete button — calls deleteTodo → DynamoDB delete */}
            <button
              onClick={() => deleteTodo(todo.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: "#cc0000",
              }}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && (
        <p style={{ color: "#999", marginTop: 20 }}>
          No todos yet. Click "+ Add Todo" to start.
        </p>
      )}
    </main>
  );
}

export default App;
