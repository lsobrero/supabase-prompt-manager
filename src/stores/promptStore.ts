import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import type { Prompt, GeminiConfig } from '../models'

export const usePromptStore = defineStore('promptStore', {
    state: () => ({
        prompts: [] as Prompt[],
        isLoading: false,
        error: null as string | null
    }),
    actions: {
        async fetchPrompts() {
            this.isLoading = true;
            this.error = null;
            try {
                const { data, error } = await supabase
                    .from('prompts')
                    .select(`
            *,
            prompt_tags (
              tags (
                id,
                name,
                color
              )
            )
          `)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform the nested Supabase response to flatten tags
                this.prompts = (data || []).map((p: any) => ({
                    ...p,
                    tags: p.prompt_tags?.map((pt: any) => pt.tags) || []
                })) as Prompt[];

            } catch (err: any) {
                this.error = err.message;
                console.error('Error fetching prompts:', err);
            } finally {
                this.isLoading = false;
            }
        },
        async savePrompt(promptData: Partial<Prompt>, tagIds: string[]) {
            this.isLoading = true;
            this.error = null;
            try {
                // Upsert the main prompt
                const { data: savedPrompt, error: promptError } = await supabase
                    .from('prompts')
                    .upsert({ ...promptData, updated_at: new Date().toISOString() })
                    .select()
                    .single();

                if (promptError) throw promptError;

                if (savedPrompt) {
                    // Re-sync Tags: first delete existing, then insert new.
                    await supabase.from('prompt_tags').delete().eq('prompt_id', savedPrompt.id);
                    if (tagIds && tagIds.length > 0) {
                        const promptTagsToInsert = tagIds.map(tagId => ({
                            prompt_id: savedPrompt.id,
                            tag_id: tagId
                        }));
                        const { error: tagError } = await supabase.from('prompt_tags').insert(promptTagsToInsert);
                        if (tagError) throw tagError;
                    }
                }
                await this.fetchPrompts();
            } catch (err: any) {
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        },
        async deletePrompt(id: string) {
            try {
                // Assuming soft delete since we have is_active
                const { error } = await supabase.from('prompts').update({ is_active: false }).eq('id', id);
                if (error) throw error;
                await this.fetchPrompts();
            } catch (err: any) {
                this.error = err.message;
            }
        }
    }
})
