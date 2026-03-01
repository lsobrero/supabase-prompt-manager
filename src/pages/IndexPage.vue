<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-my-none">Prompts</h4>
      <q-btn color="primary" icon="add" label="New Prompt" @click="openPromptDialog()" />
    </div>

    <!-- Loading State -->
    <div v-if="promptStore.isLoading" class="flex flex-center q-pa-lg">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Error State -->
    <q-banner v-else-if="promptStore.error" inline-actions class="text-white bg-red q-mb-md">
      {{ promptStore.error }}
    </q-banner>

    <!-- Prompts Grid -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="prompt in promptStore.prompts" :key="prompt.id" class="col-12 col-md-6 col-lg-4">
        <q-card class="column full-height relative-position" bordered>
          
          <q-card-section>
            <div class="text-h6 ellipsis">{{ prompt.title }}</div>
            <div class="text-caption text-grey ellipsis-2-lines" style="height: 40px;">
               {{ prompt.description || 'No description provided.' }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none col-grow">
             <div class="row q-gutter-xs q-mb-sm">
                 <q-chip 
                   v-for="tag in prompt.tags" 
                   :key="tag.id" 
                   dense 
                   size="sm" 
                   :style="{ backgroundColor: tag.color, color: 'white' }"
                 >
                   {{ tag.name }}
                 </q-chip>
             </div>
             
             <q-badge color="grey-8">{{ prompt.model_name }}</q-badge>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
             <q-btn flat round color="secondary" icon="visibility" @click="openViewDialog(prompt)">
                <q-tooltip>View</q-tooltip>
             </q-btn>
             <q-btn flat round color="primary" icon="edit" @click="openPromptDialog(prompt)">
                <q-tooltip>Edit</q-tooltip>
             </q-btn>
             <q-btn flat round color="negative" icon="delete" @click="confirmDelete(prompt.id)">
                <q-tooltip>Delete</q-tooltip>
             </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="!promptStore.isLoading && promptStore.prompts.length === 0 && !promptStore.error" class="text-center q-pa-xl text-grey-6">
       <q-icon name="inventory_2" size="4rem" />
       <p class="text-body1 q-mt-md">No prompts found. Create one to get started!</p>
    </div>

    <!-- Prompt Editor Dialog -->
    <q-dialog v-model="isDialogOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="column">
         <q-toolbar class="bg-primary text-white">
            <q-toolbar-title>{{ currentPrompt.id ? 'Edit Prompt' : 'New Prompt' }}</q-toolbar-title>
            <q-btn flat round dense icon="close" v-close-popup />
         </q-toolbar>

         <q-card-section class="col q-pt-none scroll q-pa-md">
            <div class="row q-col-gutter-md">
               <!-- Left Column: Content -->
               <div class="col-12 col-md-8">
                  <q-input v-model="currentPrompt.title" label="Title *" outlined class="q-mb-md" :rules="[val => !!val || 'Title is required']" />
                  <q-input v-model="currentPrompt.description" label="Description" outlined class="q-mb-md" />
                  <q-select 
                     v-model="selectedTags" 
                     :options="tagOptions" 
                     option-label="name" 
                     option-value="id" 
                     label="Tags" 
                     multiple 
                     use-chips 
                     use-input
                     @new-value="createTagValue"
                     @filter="filterTags"
                     outlined 
                     class="q-mb-md"
                  >
                     <template v-slot:selected-item="scope">
                        <q-chip
                           removable
                           dense
                           @remove="scope.removeAtIndex(scope.index)"
                           :tabindex="scope.tabindex"
                           :style="{ backgroundColor: scope.opt.color, color: '#fff' }"
                        >
                           {{ scope.opt.name }}
                        </q-chip>
                     </template>
                  </q-select>
                  <q-input v-model="currentPrompt.system_instruction" label="System Instruction" type="textarea" outlined autogrow class="q-mb-md" />
                  <q-input v-model="currentPrompt.content" label="Prompt Content *" type="textarea" outlined autogrow class="q-mb-md" :rules="[val => !!val || 'Content is required']" />
               </div>

               <!-- Right Column: Settings -->
               <div class="col-12 col-md-4">
                  <q-card bordered flat>
                     <q-card-section>
                        <div class="text-h6 q-mb-md">Model Settings</div>
                        <q-select v-model="currentPrompt.model_name" :options="modelOptions" label="Model" outlined class="q-mb-md" />
                        
                        <div class="q-mb-sm">Temperature: {{ currentPrompt.config?.temperature || 0 }}</div>
                        <q-slider v-model="currentPrompt.config.temperature" :min="0" :max="2" :step="0.1" label color="primary" class="q-mb-md" />
                        
                        <div class="q-mb-sm">Top K: {{ currentPrompt.config?.topK || 0 }}</div>
                        <q-slider v-model="currentPrompt.config.topK" :min="1" :max="40" :step="1" label color="primary" class="q-mb-md" />
                        
                        <div class="q-mb-sm">Top P: {{ currentPrompt.config?.topP || 0 }}</div>
                        <q-slider v-model="currentPrompt.config.topP" :min="0" :max="1" :step="0.05" label color="primary" class="q-mb-md" />
                     </q-card-section>
                  </q-card>
               </div>
            </div>
         </q-card-section>

         <q-separator />

         <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn label="Save Prompt" color="primary" @click="savePrompt" :loading="promptStore.isLoading" />
         </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Read-only View Dialog -->
    <q-dialog v-model="isViewDialogOpen" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="column">
         <q-toolbar class="bg-secondary text-white">
            <q-toolbar-title>{{ currentPrompt.title }}</q-toolbar-title>
            <q-btn flat round dense icon="close" v-close-popup />
         </q-toolbar>

         <q-card-section class="col q-pt-none scroll q-pa-md">
            <div class="row q-col-gutter-md">
               <!-- Left Column: Content -->
               <div class="col-12 col-md-8">
                  <div class="text-h6">Description</div>
                  <div class="text-body1 q-mb-md">{{ currentPrompt.description || 'No description provided.' }}</div>
                  
                  <div class="text-h6">System Instruction</div>
                  <q-card flat bordered class="q-mb-md bg-grey-1">
                     <q-card-section style="white-space: pre-wrap;" class="text-body1">{{ currentPrompt.system_instruction || 'None' }}</q-card-section>
                  </q-card>
                  
                  <div class="text-h6">Prompt Content</div>
                  <q-card flat bordered class="q-mb-md bg-grey-1">
                     <q-card-section style="white-space: pre-wrap;" class="text-body1">{{ currentPrompt.content }}</q-card-section>
                  </q-card>
               </div>

               <!-- Right Column: Settings -->
               <div class="col-12 col-md-4">
                  <q-card bordered flat>
                     <q-card-section>
                        <div class="text-h6 q-mb-md">Model Settings</div>
                        <div class="q-mb-sm"><strong>Model:</strong> {{ currentPrompt.model_name }}</div>
                        <div class="q-mb-sm"><strong>Temperature:</strong> {{ currentPrompt.config?.temperature }}</div>
                        <div class="q-mb-sm"><strong>Top K:</strong> {{ currentPrompt.config?.topK }}</div>
                        <div class="q-mb-sm"><strong>Top P:</strong> {{ currentPrompt.config?.topP }}</div>
                        
                        <div class="text-h6 q-mt-lg q-mb-sm">Tags</div>
                        <div class="row q-gutter-xs">
                           <q-chip 
                              v-for="tag in currentPrompt.tags" 
                              :key="tag.id" 
                              dense 
                              :style="{ backgroundColor: tag.color, color: 'white' }"
                           >
                              {{ tag.name }}
                           </q-chip>
                           <div v-if="!currentPrompt.tags || currentPrompt.tags.length === 0" class="text-grey text-italic">No tags</div>
                        </div>
                     </q-card-section>
                  </q-card>
               </div>
            </div>
         </q-card-section>
         <q-separator />
         <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Close" color="primary" v-close-popup />
         </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePromptStore } from '../stores/promptStore'
import { useTagStore } from '../stores/tagStore'
import { useQuasar } from 'quasar'
import type { Prompt, Tag, GeminiConfig } from '../models'

const promptStore = usePromptStore()
const tagStore = useTagStore()
const $q = useQuasar()

const isDialogOpen = ref(false)
const isViewDialogOpen = ref(false)
const selectedTags = ref<Tag[]>([])
const tagOptions = ref<Tag[]>([])

// Default values for a new prompt
const defaultPrompt = (): Partial<Prompt> => ({
  title: '',
  description: '',
  model_name: 'gemini-1.5-flash',
  system_instruction: '',
  content: '',
  config: { temperature: 1.0, topK: 40, topP: 0.95 } as GeminiConfig
})

const currentPrompt = ref<Partial<Prompt>>(defaultPrompt())

const modelOptions = ['gemini-1.5-flash', 'gemini-1.5-pro-latest', 'gemini-1.0-pro']

onMounted(async () => {
  await tagStore.fetchTags()
  tagOptions.value = tagStore.tags
  await promptStore.fetchPrompts()
})

function openPromptDialog(prompt?: Prompt) {
  if (prompt) {
     // Clone to avoid mutating state directly
     currentPrompt.value = JSON.parse(JSON.stringify(prompt))
     selectedTags.value = prompt.tags ? [...prompt.tags] : []
  } else {
     currentPrompt.value = defaultPrompt()
     selectedTags.value = []
  }
  isDialogOpen.value = true
}

function openViewDialog(prompt: Prompt) {
  currentPrompt.value = JSON.parse(JSON.stringify(prompt))
  isViewDialogOpen.value = true
}

function filterTags(val: string, update: (callback: () => void) => void) {
  if (val === '') {
    update(() => {
      tagOptions.value = tagStore.tags
    })
    return
  }
  
  update(() => {
    const needle = val.toLowerCase()
    tagOptions.value = tagStore.tags.filter(
      (v) => v.name.toLowerCase().indexOf(needle) > -1
    )
  })
}

async function createTagValue(val: string, done: (item: any, mode: 'add-unique') => void) {
  if (val.length > 0) {
    const existingTag = tagStore.tags.find((t) => t.name.toLowerCase() === val.toLowerCase())
    if (existingTag) {
      done(existingTag, 'add-unique')
      return
    }
    
    // Create new tag with default grey color
    const newTag = await tagStore.createTag(val, 'grey')
    if (newTag) {
      // Re-assign tagOptions to match updated store state
      tagOptions.value = tagStore.tags
      done(newTag, 'add-unique')
    } else {
       $q.notify({ type: 'negative', message: 'Failed to create tag.' })
    }
  }
}

async function savePrompt() {
  if (!currentPrompt.value.title || !currentPrompt.value.content) {
     $q.notify({ type: 'negative', message: 'Title and Content are required.' })
     return
  }
  
  const tagIds = selectedTags.value.map(tag => tag.id)
  await promptStore.savePrompt(currentPrompt.value, tagIds)
  
  if (!promptStore.error) {
     $q.notify({ type: 'positive', message: 'Prompt saved successfully!' })
     isDialogOpen.value = false
  }
}

function confirmDelete(id: string) {
  $q.dialog({
     title: 'Confirm Deletion',
     message: 'Are you sure you want to delete this prompt?',
     cancel: true,
     persistent: true
  }).onOk(async () => {
     await promptStore.deletePrompt(id)
     $q.notify({ type: 'info', message: 'Prompt deleted.' })
  })
}
</script>
