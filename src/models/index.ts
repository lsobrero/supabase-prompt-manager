export interface GeminiConfig {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
}

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface Prompt {
    id: string;
    title: string;
    description?: string;
    model_name: string;
    system_instruction?: string;
    content: string;
    config: GeminiConfig;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    tags?: Tag[];
}
