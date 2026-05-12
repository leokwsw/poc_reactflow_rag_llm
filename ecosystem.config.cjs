module.exports = {
    apps: [
        {
            name: "poc-reactflow-rag-llm",
            script: "npm",
            args: "run start",
            instances: 1,
            env_production: {
                NODE_ENV: "production",
                PORT: 3000,
            },
        },
    ],

    deploy: {
        production: {
            user: "root",
            host: "10.0.0.110",
            ref: "origin/main",
            repo: "git@github.com:leonard-park/poc_reactflow_rag_llm.git",
            path: "/root/poc_reactflow_rag_llm",
            'pre-deploy': 'git fetch && git reset --hard origin/main',
            "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.cjs --env production",
        },
    },
};
