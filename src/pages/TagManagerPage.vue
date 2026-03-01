<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-my-none">Tag Manager</h4>
    </div>

    <div class="row q-col-gutter-md">
       <!-- Create Tag Form -->
       <div class="col-12 col-md-4">
          <q-card bordered>
             <q-card-section>
                <div class="text-h6 q-mb-md">Create New Tag</div>
                
                <q-input v-model="newTagName" label="Tag Name" outlined class="q-mb-md" @keyup.enter="handleCreateTag" />
                
                <q-input
                   v-model="newTagColor"
                   filled
                   class="q-mb-md"
                   label="Color"
                >
                   <template v-slot:append>
                      <q-icon name="colorize" class="cursor-pointer">
                         <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-color v-model="newTagColor" />
                         </q-popup-proxy>
                      </q-icon>
                   </template>
                </q-input>

                <div class="q-mb-md">
                   <div>Preview:</div>
                   <q-chip :style="{ backgroundColor: newTagColor, color: 'white' }">{{ newTagName || 'Example' }}</q-chip>
                </div>
                
                <q-btn color="primary" label="Create Tag" class="full-width" @click="handleCreateTag" :loading="tagStore.isLoading" :disable="!newTagName" />
                <div v-if="tagStore.error" class="text-negative q-mt-sm">{{ tagStore.error }}</div>
             </q-card-section>
          </q-card>
       </div>

       <!-- Tag List -->
       <div class="col-12 col-md-8">
          <q-card bordered>
             <q-card-section>
                <div class="text-h6 q-mb-md">Existing Tags</div>
                <div v-if="tagStore.isLoading" class="flex flex-center q-pa-md">
                   <q-spinner color="primary" size="2em" />
                </div>
                <div v-else class="row q-gutter-sm">
                   <q-chip 
                      v-for="tag in tagStore.tags" 
                      :key="tag.id"
                      :style="{ backgroundColor: tag.color, color: 'white' }"
                      removable
                      @remove="deleteTag(tag.id)"
                   >
                     {{ tag.name }}
                   </q-chip>
                </div>
                <div v-if="!tagStore.isLoading && tagStore.tags.length === 0" class="text-grey q-pa-md text-center">
                   No tags created yet.
                </div>
             </q-card-section>
          </q-card>
       </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTagStore } from '../stores/tagStore'
import { useQuasar } from 'quasar'

const tagStore = useTagStore()
const $q = useQuasar()

const newTagName = ref('')
const newTagColor = ref('#1976D2')

onMounted(async () => {
  await tagStore.fetchTags()
})

async function handleCreateTag() {
   if (!newTagName.value) return;

   await tagStore.createTag(newTagName.value, newTagColor.value)
   if (!tagStore.error) {
      $q.notify({ type: 'positive', message: 'Tag created successfully!' })
      newTagName.value = '';
      newTagColor.value = '#1976D2';
   }
}

async function deleteTag(id: string) {
   $q.dialog({
     title: 'Confirm Deletion',
     message: 'Are you sure you want to delete this tag? It will be removed from all prompts.',
     cancel: true,
     persistent: true
  }).onOk(async () => {
     await tagStore.deleteTag(id)
     $q.notify({ type: 'info', message: 'Tag deleted.' })
  })
}
</script>
