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
                ELASTICSEARCH_HOSTNAME:"10.0.0.106",
                ELASTICSEARCH_PORT:9200,
                ELASTICSEARCH_USERNAME:"elastic",
                ELASTICSEARCH_PASSWORD:"password",
                ELASTICSEARCH_PROTOCOL:"http",
                ELASTICSEARCH_RAG_CHUNKS_INDEX:"rag_chunks",
                POSTGRES_HOST:"10.0.0.209",
                POSTGRES_PORT:5432,
                POSTGRES_USER:"postgres",
                POSTGRES_PASSWORD:"password",
                POSTGRES_DATABASE:"postgres",
                POSTGRES_SCHEMA:"public",
                R2_S3_API:"https://e9d2e49e12dfd9fb87710bd33a3a5fed.r2.cloudflarestorage.com/poc-reactflow-rag-llm",
                R2_BUCKET:"poc-reactflow-rag-llm",
                R2_ACCESS_KEY_ID:process.env.R2_ACCESS_KEY_ID,
                R2_SECRET_ACCESS_KEY:process.env.R2_SECRET_ACCESS_KEY
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
