<script setup>
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

const defaultData = [
  {
    id: 1,
    titleEn: 'Depth of Love',
    titleNative: '秘色临界',
    actors: [
      { name: 'Liu Xi Yu', gender: 'female' },
      { name: 'Cao Tian Kai', gender: 'male' }
    ],
    released: 2025,
    genres: ['Comedy', 'Romance'],
    tropes: ['CEO', 'Enemies to Lovers', 'Contract Marriage'],
    platform: 'YouTube',
    rating: 5,
    status: 'Completed',
    isFavorite: true
  }
]

const dramas = useStorage('my-vibrant-drama-library', defaultData)

const hasSeenPrivacyNotice = useStorage('has-seen-privacy-notice', false)
const dismissPrivacyNotice = () => {
  hasSeenPrivacyNotice.value = true
}

dramas.value = dramas.value.map(drama => ({
  ...drama,
  actors: (drama.actors || []).map(a => 
    typeof a === 'string' ? { name: a, gender: 'unknown' } : a
  )
}))

// ========== 1. Filter & Selection Logic ==========
const showFavoritesOnly = ref(false)
const displayedDramas = computed(() => {
  if (showFavoritesOnly.value) return dramas.value.filter(d => d.isFavorite)
  return dramas.value
})

const toggleFavorite = (drama) => { drama.isFavorite = !drama.isFavorite }

const selectedIds = ref([])
const isAllSelected = computed(() => displayedDramas.value.length > 0 && selectedIds.value.length === displayedDramas.value.length)
const toggleAll = (e) => {
  if (e.target.checked) selectedIds.value = displayedDramas.value.map(d => d.id)
  else selectedIds.value = []
}

// ========== 2. Modal Logic (Add/Edit) ==========
const isEditing = ref(false)
const isAdding = ref(false)
const editForm = ref({ actors: [] })

const openAddModal = () => {
  editForm.value = {
    id: null,
    titleEn: '',
    titleNative: '',
    actors: [{ name: '', gender: 'female' }],
    released: new Date().getFullYear(),
    rating: 8,
    genresStr: '',
    tropesStr: '',
    status: 'Plan to Watch',
    isFavorite: false
  }
  isAdding.value = true
  isEditing.value = true
}

const startEdit = (drama) => {
  editForm.value = {
    ...drama,
    actors: JSON.parse(JSON.stringify(drama.actors || [])),
    genresStr: (drama.genres || []).join(', '),
    tropesStr: (drama.tropes || []).join(', ')
  }
  isAdding.value = false
  isEditing.value = true
}

const addActorInput = () => editForm.value.actors.push({ name: '', gender: 'female' })
const removeActorInput = (index) => editForm.value.actors.splice(index, 1)

const saveEdit = () => {
  try {
    const payload = {
      ...editForm.value,
      genres: (editForm.value.genresStr || '').split(',').map(s => s.trim()).filter(Boolean),
      tropes: (editForm.value.tropesStr || '').split(',').map(s => s.trim()).filter(Boolean),
      actors: (editForm.value.actors || []).filter(a => a && a.name && a.name.trim() !== '')
    }
    delete payload.genresStr
    delete payload.tropesStr

    if (isAdding.value) {
      payload.id = Date.now()
      dramas.value.unshift(payload)
    } else {
      const index = dramas.value.findIndex(d => d.id === payload.id)
      if (index !== -1) {
        dramas.value.splice(index, 1, payload)
      }
    }
    isEditing.value = false
  } catch (error) {
    console.error("Error saving drama:", error)
    alert("An error occurred while saving. Please check your inputs.")
  }
}

const deleteDrama = (id) => {
  if (confirm('Are you sure you want to delete this drama?')) {
    dramas.value = dramas.value.filter(d => d.id !== id)
    selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id)
  }
}

// ========== 3. Smart Import / Export Logic ==========
const exportToJson = () => {
  const dataToExport = selectedIds.value.length > 0 
    ? dramas.value.filter(d => selectedIds.value.includes(d.id))
    : dramas.value

  const dataStr = JSON.stringify(dataToExport, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `my_dramas_${new Date().toISOString().slice(0,10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const importFromJson = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result)
      const formattedImport = imported.map(d => ({
        ...d,
        actors: (d.actors || []).map(a => typeof a === 'string' ? { name: a, gender: 'unknown' } : a)
      }))

      let addedCount = 0
      let updatedCount = 0
      const currentData = [...dramas.value]

      formattedImport.forEach(importedDrama => {
        const existingIndex = currentData.findIndex(local => {
          const isSameId = local.id === importedDrama.id;
          const isSameEnTitle = local.titleEn && importedDrama.titleEn && 
                local.titleEn.toLowerCase().trim() === importedDrama.titleEn.toLowerCase().trim();
          const isSameNativeTitle = local.titleNative && importedDrama.titleNative && 
                local.titleNative.trim() === importedDrama.titleNative.trim();
          const isSameYear = Number(local.released) === Number(importedDrama.released);

          return isSameId || ((isSameEnTitle || isSameNativeTitle) && isSameYear);
        })

        if (existingIndex !== -1) {
          const localDrama = currentData[existingIndex]
          currentData[existingIndex] = {
            ...importedDrama,
            id: localDrama.id,
            rating: localDrama.rating, 
            status: localDrama.status, 
            isFavorite: localDrama.isFavorite 
          }
          updatedCount++
        } else {
          currentData.unshift({
            ...importedDrama,
            id: Date.now() + Math.random()
          })
          addedCount++
        }
      })

      dramas.value = currentData
      alert(`Import successful!\nAdded ${addedCount} new drama(s).\nUpdated ${updatedCount} existing drama(s).`)
      
    } catch (err) {
      console.error(err)
      alert('JSON format error. Please check your file.')
    } finally {
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 text-gray-800 p-8 font-sans">
    
    <!-- Header Section -->
    <div class="max-w-6xl mx-auto flex flex-col mb-8 gap-4">
      
      <div v-if="!hasSeenPrivacyNotice" class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in-down">
        <div class="flex items-start gap-2.5">
          <span class="text-lg leading-none mt-0.5">💡</span>
          <span class="text-xs text-blue-800 font-medium leading-relaxed">
            <strong>Data Privacy Note:</strong> Your watchlist is stored safely and privately in your browser's local storage. Please remember to Export JSON regularly to back up your data before clearing your browser cache!
          </span>
        </div>
        <button @click="dismissPrivacyNotice" class="shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-xs shadow-sm active:scale-95">
          Got it!
        </button>
      </div>

      <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        <div>
          <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500 tracking-tight">
            ✨ My Drama Universe
          </h1>
          <p class="text-gray-500 text-sm mt-1 font-medium">Track every heart-fluttering watch</p>
        </div>
        
        <div class="flex flex-col items-start xl:items-end gap-2">
          
          <div class="flex items-center gap-3 flex-wrap xl:justify-end">
            <button @click="openAddModal" class="px-5 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-full shadow-lg shadow-fuchsia-200 text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1">
              <span class="text-lg leading-none">+</span> New Drama
            </button>

            <button @click="showFavoritesOnly = !showFavoritesOnly"
              :class="showFavoritesOnly ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-white text-gray-600 shadow-gray-100'"
              class="px-4 py-2 rounded-full shadow-md font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1">
              <span v-if="!showFavoritesOnly">🤍 Favorites Only</span>
              <span v-else>❤️ View All</span>
            </button>

            <label class="cursor-pointer px-4 py-2 bg-white text-indigo-600 font-bold rounded-full shadow-md text-sm transition-all hover:scale-105 active:scale-95">
              📥 Import
              <input type="file" accept=".json" class="hidden" @change="importFromJson" />
            </label>
            
            <button @click="exportToJson" 
                    class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-full shadow-md shadow-indigo-200 text-sm transition-all hover:scale-105 active:scale-95">
              📤 {{ selectedIds.length > 0 ? `Export Selected (${selectedIds.length})` : 'Export All' }}
            </button>
            
            <a href="/mydramatracker/DramaTracker-Offline.html" download="DramaTracker-Offline.html" 
             class="px-4 py-2 bg-slate-800 text-white font-bold rounded-full shadow-md shadow-slate-300 text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1">
              ⬇️ Offline App (HTML)
            </a>
          </div>
          
          <div class="text-[11px] text-amber-600/90 font-medium flex items-center gap-1.5 px-1 mt-0.5">
            <span>⚠️</span>
            <span>Tip: Always export JSON as a backup before clearing browser data or switching devices.</span>
          </div>

        </div>
      </div>
      
      <div class="bg-emerald-50 border border-emerald-200/70 rounded-xl px-4 py-3 text-xs text-emerald-800 flex items-center gap-2.5 shadow-sm mt-1">
        <span class="text-base">🔒</span>
        <span class="font-medium"><strong>100% Local & Private:</strong> Your data never touches a server. Swap lists with friends using Import/Export above!</span>
      </div>

    </div>

    <!-- Main List Card -->
    <div class="max-w-6xl mx-auto bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow-xl overflow-hidden">
      
      <div class="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 text-xs text-gray-400 font-black uppercase tracking-wider items-center">
        <div class="col-span-1 flex justify-center">
          <input type="checkbox" @change="toggleAll" :checked="isAllSelected" class="w-4 h-4 rounded text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 cursor-pointer">
        </div>
        <div class="col-span-3">Drama</div>
        <div class="col-span-2">Cast</div>
        <div class="col-span-1 text-center">Year</div>
        <div class="col-span-2">Tags</div>
        <div class="col-span-2">Status</div>
        <div class="col-span-1 text-center">Action</div>
      </div>

      <div v-for="drama in displayedDramas" :key="drama.id" 
           class="grid grid-cols-12 gap-4 p-5 items-center border-b border-gray-50 last:border-0 hover:bg-white hover:shadow-lg transition-all duration-300 group"
           :class="{'bg-indigo-50/50': selectedIds.includes(drama.id)}">
        
        <div class="col-span-1 flex justify-center">
          <input type="checkbox" v-model="selectedIds" :value="drama.id" class="w-4 h-4 rounded text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 cursor-pointer">
        </div>

        <div class="col-span-3">
          <h3 class="text-lg font-bold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{{ drama.titleEn }}</h3>
          <p class="text-sm text-gray-400 mt-1 font-medium">{{ drama.titleNative }}</p>
        </div>

        <div class="col-span-2 flex flex-col gap-1">
          <div v-for="actor in drama.actors" :key="actor.name" class="text-sm font-medium flex items-center">
            <span v-if="actor.gender === 'female'" class="text-rose-400 mr-1.5 font-bold">♀</span>
            <span v-else-if="actor.gender === 'male'" class="text-blue-500 mr-1.5 font-bold">♂</span>
            <span v-else class="text-gray-400 mr-1.5 font-bold">?</span>
            <span class="text-gray-600">{{ actor.name }}</span>
          </div>
        </div>

        <div class="col-span-1 text-center font-bold text-gray-500">
          {{ drama.released }}
        </div>

        <div class="col-span-2 flex flex-wrap gap-1.5 items-start">
          <span v-for="genre in drama.genres" :key="genre" 
                class="px-2 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-md">
            {{ genre }}
          </span>
          <span v-for="trope in (drama.tropes || [])" :key="trope"
                class="px-2 py-1 text-xs font-bold bg-pink-50 text-pink-600 rounded-md">
            {{ trope }}
          </span>
        </div>

        <div class="col-span-2 flex flex-col gap-2">
          <div class="text-sm font-black text-amber-400 flex items-center">
            ⭐ <span class="text-gray-700 ml-1">{{ drama.rating }} / 10</span>
          </div>
          <select v-model="drama.status" 
                  class="text-xs font-bold px-2 py-1.5 rounded-md outline-none cursor-pointer border-none shadow-sm transition-colors"
                  :class="{
                    'bg-emerald-100 text-emerald-700': drama.status === 'Completed',
                    'bg-blue-100 text-blue-700': drama.status === 'Watching',
                    'bg-gray-100 text-gray-600': drama.status === 'Plan to Watch'
                  }">
            <option value="Completed">Completed</option>
            <option value="Watching">Watching</option>
            <option value="Plan to Watch">Plan to Watch</option>
          </select>
        </div>

        <div class="col-span-1 flex flex-col gap-2 items-center">
          <div class="flex gap-1.5">
            <button @click="toggleFavorite(drama)" 
                    class="p-2 rounded-lg transition-all hover:scale-110 active:scale-90"
                    :class="drama.isFavorite ? 'bg-rose-100 text-rose-500' : 'bg-gray-50 text-gray-300 hover:text-rose-400'">
              <svg xmlns="http://www.w3.org/2000/svg" :fill="drama.isFavorite ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
            </button>
            <button @click="startEdit(drama)" class="p-2 rounded-lg bg-gray-50 text-blue-500 hover:bg-blue-100 hover:scale-110 active:scale-90 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
            </button>
            <button @click="deleteDrama(drama.id)" class="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-100 hover:text-red-600 hover:scale-110 active:scale-90 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="displayedDramas.length === 0" class="p-10 text-center text-gray-400 font-medium">
        It's empty here. Add or import your dramas!
      </div>
    </div>

    <div class="max-w-6xl mx-auto mt-8 bg-white/50 backdrop-blur-sm border border-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div class="text-xs text-gray-500 max-w-2xl">
        <h4 class="font-bold text-gray-700 mb-1.5 text-sm">FAQ: Will I lose my data if I clear my browser cache?</h4>
        <p class="leading-relaxed">
        Yes. Because this tool runs 100% client-side without a backend database, clearing your browser's site data or cache will wipe the local storage. We strongly recommend exporting your JSON backup periodically.
      </p>
      </div>
      
      <div class="text-left md:text-right shrink-0">
         <p class="font-medium text-[11px] text-gray-400 mb-1 uppercase tracking-wider">100% Open Source</p>
         <a href="https://github.com/mucun-laomanong/mydramatracker" target="_blank" class="inline-flex items-center gap-1.5 font-bold text-sm text-gray-600 hover:text-indigo-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            View Source on GitHub
         </a>
      </div>
    </div>
  </div>

  <!-- Modal (Edit/Add) -->
  <div v-if="isEditing" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col font-sans">
      <div class="p-6 bg-gradient-to-r from-indigo-50 to-pink-50 border-b border-gray-100 flex justify-between items-center">
        <h2 class="text-xl font-black text-gray-800">{{ isAdding ? '✨ Add New Drama' : '✏️ Edit Drama Info' }}</h2>
        <button @click="isEditing = false" class="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
      </div>
      
      <div class="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">English / Romaji Title</label>
          <input v-model="editForm.titleEn" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Native Title (e.g., Chinese/Korean)</label>
          <input v-model="editForm.titleNative" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Release Year</label>
            <input type="number" v-model="editForm.released" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Rating (1-10)</label>
            <input type="number" v-model="editForm.rating" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
          </div>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label class="block text-xs font-bold text-gray-700 mb-3">Cast & Crew</label>
          <div class="flex flex-col gap-2">
            <div v-for="(actor, index) in editForm.actors" :key="index" class="flex gap-2 items-center">
              <input v-model="actor.name" placeholder="Actor Name" class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500" />
              <select v-model="actor.gender" class="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white outline-none">
                <option value="female">♀ Female</option>
                <option value="male">♂ Male</option>
                <option value="unknown">? Other</option>
              </select>
              <button @click="removeActorInput(index)" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <button @click="addActorInput" class="mt-3 text-xs font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-md transition-colors">
            + Add Actor
          </button>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Genres (comma-separated)</label>
          <input v-model="editForm.genresStr" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" placeholder="e.g. Comedy, Romance" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Tropes (comma-separated)</label>
          <input v-model="editForm.tropesStr" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" placeholder="e.g. CEO, Enemies to Lovers" />
        </div>
      </div>
      
      <div class="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        <button @click="isEditing = false" class="px-5 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-200 transition-colors">Cancel</button>
        <button @click="saveEdit" class="px-5 py-2 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-colors">
          {{ isAdding ? 'Confirm Add' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in-down {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-down {
  animation: fade-in-down 0.4s ease-out forwards;
}
</style>