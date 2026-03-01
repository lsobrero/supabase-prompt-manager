import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import type { Tag } from '../models'

export const useTagStore = defineStore('tagStore', {
    state: () => ({
        tags: [] as Tag[],
        isLoading: false,
        error: null as string | null
    }),
    actions: {
        async fetchTags() {
            this.isLoading = true
            this.error = null
            try {
                const { data, error } = await supabase
                    .from('tags')
                    .select('*')
                    .order('name')

                if (error) throw error
                this.tags = data as Tag[]
            } catch (err: any) {
                this.error = err.message
            } finally {
                this.isLoading = false
            }
        },
        async createTag(name: string, color: string): Promise<Tag | undefined> {
            try {
                const { data, error } = await supabase.from('tags').insert({ name, color }).select().single()
                if (error) throw error;
                await this.fetchTags()
                return data as Tag
            } catch (err: any) {
                this.error = err.message
                return undefined
            }
        },
        async updateTag(id: string, name: string, color: string): Promise<Tag | undefined> {
            try {
                const { data, error } = await supabase.from('tags').update({ name, color }).eq('id', id).select().single()
                if (error) throw error;
                await this.fetchTags()
                return data as Tag
            } catch (err: any) {
                this.error = err.message
                return undefined
            }
        },
        async deleteTag(id: string) {
            try {
                const { error } = await supabase.from('tags').delete().eq('id', id)
                if (error) throw error;
                await this.fetchTags()
            } catch (err: any) {
                this.error = err.message
            }
        }
    }
})
