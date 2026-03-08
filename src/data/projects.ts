export const TAGS = {
    PYTHON: {
        name: "Python",
        class: "bg-[#3572A5]/20 text-[#ffd43b]",
        icon: "lucide:code-2",
    },
    RL: {
        name: "Reinforcement Learning",
        class: "bg-[#2563eb]/20 text-[#93c5fd]",
        icon: "lucide:brain",
    },
    C: {
        name: "C",
        class: "bg-[#555555]/20 text-[#aaaaaa]",
        icon: "lucide:terminal",
    },
    ML: {
        name: "Machine Learning",
        class: "bg-[#1d4ed8]/20 text-[#bfdbfe]",
        icon: "lucide:chart-line",
    },
    FULLSTACK: {
        name: "Full-Stack",
        class: "bg-[#7c3aed]/20 text-[#c4b5fd]",
        icon: "lucide:layers",
    },
    WEBSOCKETS: {
        name: "WebSockets",
        class: "bg-[#059669]/20 text-[#6ee7b7]",
        icon: "lucide:radio",
    },
    NETWORKING: {
        name: "Networking",
        class: "bg-[#065f46]/20 text-[#6ee7b7]",
        icon: "lucide:network",
    },
};

export const PROJECTS = [
    {
        title: "transcend",
        description:
            "Full-stack multiplayer Pong with server-authoritative physics, real-time WebSockets, custom JWT from scratch, OAuth, tournaments, and a curses-based CLI client — 617 commits. Team: andresmejiaro, MatPizzolo, Splix777, HakimHC, adrgonza.",
        link: "",
        github: "https://github.com/andresmejiaro/transcend",
        image: "/projects/transcend.gif",
        tags: [TAGS.FULLSTACK, TAGS.WEBSOCKETS, TAGS.PYTHON],
    },
    {
        title: "slither",
        description:
            "Deep Q-Learning agent that teaches itself to play Snake. Clean Game / Agent / Interpreter separation — the agent has no idea what Snake is, only what the state vector means.",
        link: "",
        github: "https://github.com/andresmejiaro/slither",
        image: "/projects/slither.gif",
        tags: [TAGS.PYTHON, TAGS.RL],
    },
    {
        title: "leaffliction",
        description:
            "End-to-end plant disease classifier in PyTorch: dataset analysis, six augmentation types, model training, and single-image inference — all driven by make targets.",
        link: "",
        github: "https://github.com/andresmejiaro/leaffliction",
        image: "/projects/leaffliction.gif",
        tags: [TAGS.PYTHON, TAGS.ML],
    },
    {
        title: "multilayer-perceptron",
        description:
            "A feedforward neural network built from scratch in Python — no PyTorch, no TensorFlow. Forward pass, backpropagation, and training loop implemented by hand. Applied to the Wisconsin Breast Cancer dataset; MNIST example included.",
        link: "",
        github: "https://github.com/andresmejiaro/multilayer-perceptron",
        image: "/projects/multilayer-perceptron.gif",
        tags: [TAGS.PYTHON, TAGS.ML],
    },
    {
        title: "fractol",
        description:
            "Interactive fractal explorer in C: Mandelbrot, Julia, Cubic, and Newton sets rendered with MiniLibX. Complex arithmetic implemented from scratch — no <complex.h>.",
        link: "",
        github: "https://github.com/andresmejiaro/fractol",
        image: "/projects/fractol.gif",
        tags: [TAGS.C],
    },
    // ft_ping — WIP, hidden until complete
];
