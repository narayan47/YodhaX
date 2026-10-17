
export const ASSESSMENTS = {
  javascript: [
    {
      id: "js1",
      question: "Which method creates a new array by transforming each element?",
      options: ["forEach()", "map()", "filter()", "find()"],
      answer: 1,
    },
    {
      id: "js2",
      question: "What does await do inside an async function?",
      options: [
        "Stops the entire server",
        "Waits for a promise to settle",
        "Converts an object to JSON",
        "Creates a new promise automatically",
      ],
      answer: 1,
    },
    {
      id: "js3",
      question: "Which declaration is block-scoped?",
      options: ["var", "let", "Both are function-scoped", "Neither"],
      answer: 1,
    },
    {
      id: "js4",
      question: "What does === compare?",
      options: [
        "Only values after coercion",
        "Only object references",
        "Value and type without coercion",
        "Only data types",
      ],
      answer: 2,
    },
    {
      id: "js5",
      question: "Which method handles a rejected promise in a chain?",
      options: [".then()", ".catch()", ".map()", ".join()"],
      answer: 1,
    },
  ],

  nodejs: [
    {
      id: "node1",
      question: "Which module is commonly used to create an HTTP server?",
      options: ["fs", "http", "path", "events"],
      answer: 1,
    },
    {
      id: "node2",
      question: "What is middleware in Express?",
      options: [
        "A MongoDB collection",
        "A function in the request-response pipeline",
        "A CSS framework",
        "A Node.js installation",
      ],
      answer: 1,
    },
    {
      id: "node3",
      question: "Which object contains environment variables?",
      options: ["process.env", "global.env", "node.config", "http.env"],
      answer: 0,
    },
    {
      id: "node4",
      question: "What does res.status(404).json(data) do?",
      options: [
        "Creates a file",
        "Sends a JSON response with status 404",
        "Redirects to another server",
        "Updates a database",
      ],
      answer: 1,
    },
    {
      id: "node5",
      question: "Why should CPU-heavy work be handled carefully in Node.js?",
      options: [
        "It can block the event loop",
        "It always deletes requests",
        "It disables HTTP",
        "It prevents JSON parsing",
      ],
      answer: 0,
    },
  ],

  react: [
    {
      id: "react1",
      question: "Which hook manages local component state?",
      options: ["useEffect", "useState", "useMemo", "useRef"],
      answer: 1,
    },
    {
      id: "react2",
      question: "Why are keys used when rendering lists?",
      options: [
        "To encrypt elements",
        "To help React identify list items",
        "To make API requests",
        "To replace props",
      ],
      answer: 1,
    },
    {
      id: "react3",
      question: "When does an effect with [] normally run?",
      options: [
        "After every render",
        "On initial mount, with development-mode caveats",
        "Only when a button is clicked",
        "Never",
      ],
      answer: 1,
    },
    {
      id: "react4",
      question: "What is a controlled input?",
      options: [
        "An input whose value is driven by React state",
        "An input that cannot be edited",
        "An input without an onChange handler",
        "An input stored only in the database",
      ],
      answer: 0,
    },
    {
      id: "react5",
      question: "What is the usual purpose of useMemo?",
      options: [
        "Perform navigation",
        "Cache a computed value between renders",
        "Replace all state",
        "Fetch data automatically",
      ],
      answer: 1,
    },
  ],

  python: [
    {
      id: "py1",
      question: "Which Python type is mutable?",
      options: ["tuple", "str", "list", "int"],
      answer: 2,
    },
    {
      id: "py2",
      question: "Which keyword defines a function?",
      options: ["func", "def", "function", "method"],
      answer: 1,
    },
    {
      id: "py3",
      question: "What does len([2, 4, 6]) return?",
      options: ["2", "3", "6", "12"],
      answer: 1,
    },
    {
      id: "py4",
      question: "Which structure stores key-value pairs?",
      options: ["set", "tuple", "dict", "range"],
      answer: 2,
    },
    {
      id: "py5",
      question: "What does a try/except block help with?",
      options: [
        "Handling exceptions",
        "Creating classes only",
        "Installing packages",
        "Declaring constants",
      ],
      answer: 0,
    },
  ],

  sql: [
    {
      id: "sql1",
      question: "Which statement retrieves rows?",
      options: ["GET", "SELECT", "FETCH TABLE", "READ"],
      answer: 1,
    },
    {
      id: "sql2",
      question: "Which clause filters rows?",
      options: ["ORDER BY", "GROUP BY", "WHERE", "JOIN"],
      answer: 2,
    },
    {
      id: "sql3",
      question: "Which function counts rows?",
      options: ["SUM(*)", "COUNT(*)", "ROWS()", "TOTAL(*)"],
      answer: 1,
    },
    {
      id: "sql4",
      question: "What is a primary key?",
      options: [
        "A field that identifies a row uniquely",
        "A duplicate row",
        "A sort order",
        "A database backup",
      ],
      answer: 0,
    },
    {
      id: "sql5",
      question: "Which join returns matching rows from both tables?",
      options: ["CROSS JOIN", "INNER JOIN", "FULL JOIN", "No join"],
      answer: 1,
    },
  ],
};

export function normalizeAssessmentSkill(value = "") {
  const name = String(value).trim().toLowerCase();

  const aliases = {
    "javascript": "javascript",
    "js": "javascript",
    "node": "nodejs",
    "node.js": "nodejs",
    "nodejs": "nodejs",
    "react.js": "react",
    "reactjs": "react",
    "react": "react",
    "python": "python",
    "sql": "sql",
  };

  return aliases[name] || name;
}
