export const TAGS = {
    ASTRO: {
        name: "Astro",
        class: "bg-[#2563eb]/20 text-[#eff6ff]",
        icon: "lucide:rocket",
    },
    REACT: {
        name: "React",
        class: "bg-[#23272f] text-[#58c4dc]",
        icon: "lucide:atom",
    },
    TAILWIND: {
        name: "Tailwind CSS",
        class: "bg-[#003159] text-white",
        icon: "lucide:wind",
    },
    NODE: {
        name: "Node.js",
        class: "bg-[#339933]/20 text-[#6cc24a]",
        icon: "lucide:server",
    },
};

export const PROJECTS = [
    {
        title: "Developer Visibility Blog",
        description:
            "Placeholder project card: Astro blog + activity feed + publish endpoint for automated markdown delivery from a mobile app workflow.",
        link: "/",
        github: "https://github.com/your-profile/developer-visibility-blog",
        image: "/projects/cryptoviz.webp",
        tags: [TAGS.REACT, TAGS.TAILWIND, TAGS.NODE],
    },
    {
        title: "Content Pipeline App (Preview Scope)",
        description:
            "Placeholder project card: planned React Native companion app for brief-to-draft generation, offline approval, and one-tap LinkedIn sharing.",
        link: "/activity",
        github: "https://github.com/your-profile/content-pipeline-app",
        image: "/projects/ecoearth.webp",
        tags: [TAGS.ASTRO, TAGS.TAILWIND, TAGS.REACT],
    },
];
