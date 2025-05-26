<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { tick } from 'svelte';

	// Types
	interface Student {
		id: number;
		nim: string;
		nama: string;
		email: string;
		program_id: number;
		pengguna_id: number;
		semester: number;
		tahun_masuk: number;
		status: string;
		nomor_telepon: string;
	}

	interface KRSItem {
		id: string;
		course_id: string;
		course: Course;
		status: 'active' | 'dropped';
		added_at: string;
	}
	let mataKuliah: any[] = [];

	interface LetterRequest {
		id: string;
		type: 'surat_aktif_kuliah';
		keperluan: string;
		status: 'menunggu' | 'disetujui' | 'ditolak';
		created_at: string;
		updated_at: string;
		notes?: string;
	}

	// API Base URL - sesuaikan dengan backend Node.js Anda
	const API_BASE = 'http://localhost:3000/api';

	// Stores
	const student = writable<Student | null>(null);
	const krs = writable<KRSItem[]>([]);
	const availableCourses = writable<Course[]>([]);
	const letterRequests = writable<LetterRequest[]>([]);
	const isLoading = writable(false);



	// Current view
	let currentView = 'dashboard'; // Default view
	let showEditProfile = false;
	let showAddCourse = false;
	let showAddLetter = false;
	let editingLetter: LetterRequest | null = null;

	// Form data
	let profileForm: Partial<Student> = {};
	let newLetterPurpose = '';

	// API Functions
	// async function apiCall(endpoint: string, options: RequestInit = {}) {
	// 	const token = localStorage.getItem('token'); // Assuming you store JWT token
	// 	const response = await fetch(`${API_BASE}${endpoint}`, {
	// 		headers: {
	// 			'Content-Type': 'application/json',
	// 			'Authorization': `Bearer ${token}`,
	// 			...options.headers
	// 		},
	// 		...options
	// 	});

	// 	if (!response.ok) {
	// 		console.error(`API Error: ${response.status}`, await response.text());
	//     throw new Error(`API Error: ${response.status}`);
	// 	}

	// 	return response.json();
	// }


	async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No token found');
  }

  console.log("Token:", token);
  console.log("Endpoint:", `${API_BASE}${endpoint}`);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`API Error: ${response.status} ${error}`);
    throw new Error(`API Error: ${response.status} ${error}`);
  }

  return response.json();
}

	// Student Profile Functions
	async function loadProfile() {
		try {
			isLoading.set(true);
			const data = await apiCall('/auth/profile'); // Assuming 'me' for current user
			student.set(data.data);
			profileForm = { ...data.data};
		} catch (error) {
			console.error('Error loading profile:', error);
		} finally {
			isLoading.set(false);
		}
	}

	async function updateProfile() {
		try {
			isLoading.set(true);
			const data = await apiCall('/mahasiswa/me', {
				method: 'PUT',
				body: JSON.stringify(profileForm)
			});
			student.set(data);
			showEditProfile = false;
		} catch (error) {
			console.error('Error updating profile:', error);
		} finally {
			isLoading.set(false);
		}
	}
	interface Course {
		id: number;
		program_id: number;
		kode: string;
		nama: string;
		sks: number;
		jadwal: string;
		nama_dosen: string;
		nama_mata_kuliah: string;
		mata_kuliah_id: number;
		mahasiswa_id: number;
		total_baris: number;
		total_sks: number;
	}
  // Ambil elemen pertama jika ada

export const courses = writable<Course[]>([]);
export const isCoursesLoading = writable(false);

export async function fetchCourses() {
  try {
    isCoursesLoading.set(true);

    const response = await apiCall('/krs/available-mata-kuliah');

    if (!response.success) {
      throw new Error('Gagal mengambil data mata kuliah');
    }

    console.log('DATA DARI API:', response.data); // ✅ debug

    courses.set(response.data);
  } catch (error) {
    console.error('Error fetching courses:', error);
    courses.set([]);
  } finally {
    isCoursesLoading.set(false);
  }
}
  $: totalBaris = $courses.length > 0 ? $courses[0].total_baris : 0;
  $: totalSks = $courses.reduce((sum, course) => sum + course.sks, 0);

  interface ListKrs {
  id: number;
  program_id: number;
  kode: string;
	semester: number;
	tahun_masuk: number;
  nama_mata_kuliah: string;
  sks: number;
  jadwal: string;
  nama_dosen: string;
  matkul_id: number;
  mahasiswa_id: number;
	total_baris : number;
}

export const krsList = writable<ListKrs[]>([]);

// KRS Functions
async function loadKRS() {
  try {
    isLoading.set(true);
    const response = await apiCall('/krs',{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

    if (!response.success) {
      throw new Error('Gagal mengambil data KRS');
    }

    krsList.set(response.data);

  } catch (error) {
    console.error('Error loading KRS:', error);
  } finally {
    isLoading.set(false);
  }
}


	async function loadAvailableCourses() {
		try {
			const data = await apiCall('/krs/courses/available'); // Endpoint untuk mata kuliah yang bisa diambil
			availableCourses.set(data);
		} catch (error) {
			console.error('Error loading courses:', error);
		}
	}


	async function addCourseToKRS(
		matkul_id: number
	) {
		try {
			isLoading.set(true);
			await apiCall('/krs', {
				method: 'POST',
				body: JSON.stringify({
					mata_kuliah_id: matkul_id
				})
			});
			await loadKRS();
			showAddCourse = false;
		} catch (error) {
			console.error('Error adding course to KRS:', error);
		} finally {
			isLoading.set(false);
		}
	}


	// removeCourseFromKRS.ts

interface RemoveKRSResponse {
  message: string;
  // Tambahkan properti lain jika ada, misalnya: success: boolean;
}

	export async function removeCourseFromKRS(
		mata_kuliah_id: number,
		mahasiswa_id: number
	): Promise<RemoveKRSResponse> {
		const res = await apiCall('/krs/delete', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ mahasiswa_id, mata_kuliah_id })
		});

		// Update store lokal, tanpa reload data dari server
		courses.update(items =>
			items.filter(item => item.mata_kuliah_id !== mata_kuliah_id)
		);

		const data: RemoveKRSResponse = await res.json();
		return data;
	}


	// Letter Request Functions
	async function loadLetterRequests() {
		try {
			isLoading.set(true);
			const data = await apiCall('/pengajuan');
			letterRequests.set(data.data);
		} catch (error) {
			console.error('Error loading letter requests:', error);
		} finally {
			isLoading.set(false);
		}
	}

	async function createLetterRequest() {
		try {
			isLoading.set(true);
			const response = await apiCall('/pengajuan', {
				method: 'POST',
				body: JSON.stringify({
					jenis_surat: 'surat_aktif_kuliah',
					keperluan: newLetterPurpose
				})
			});

		if (!response.success) {
		throw new Error(response.error || 'Gagal mengirim pengajuan');
		}
			await loadLetterRequests();
			showAddLetter = false;
			newLetterPurpose = '';
		} catch (error) {
			console.error('Error creating letter request:', error);
		} finally {
			isLoading.set(false);
		}
	}

	async function updateLetterRequest(id: string, keperluan: string) {
		try {
			isLoading.set(true);
			await apiCall(`/pengajuan/${id}`, {
				method: 'PUT',
				body: JSON.stringify({ keperluan })
			});
			await loadLetterRequests();
			editingLetter = null;
		} catch (error) {
			console.error('Error updating letter request:', error);
		} finally {
			isLoading.set(false);
		}
	}

	async function deleteLetterRequest(id: string) {
		try {
			isLoading.set(true);
			await apiCall(`/pengajuan/${id}`, {
				method: 'DELETE'
			});
			await loadLetterRequests();
		} catch (error) {
			console.error('Error deleting letter request:', error);
		} finally {
			isLoading.set(false);
		}
	}


interface grade {
  semester: string;
	nama_matahasiswa: string;
	kode: string;
	nama_mata_kuliah: string;
	sks: number;
	nilai_angka: string;
	nilai_huruf: string;
	peringkat: string;
	ipk: number;
	total_sks_lulus: number;
	total_sks_tidak_lulus: number;
}
export const gradeList = writable<grade[]>([]);
  $: semester = $gradeList.length > 0 ? $gradeList[0].semester : 0;
  $: totalSk_tidak_lulus = $gradeList.reduce((sum, course) => course.total_sks_tidak_lulus, 0);
  $: totalSk_lulus = $gradeList.reduce((sum, course) => course.total_sks_lulus, 0);
	$: ipk = $gradeList.length > 0 ? $gradeList[0].ipk : 0;

	async function getGrades(){
		try {
    isLoading.set(true);
    const response = await apiCall('/krs/nilai',{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

    if (!response.success) {
      throw new Error('Gagal mengambil data nilai');
    }

    gradeList.set(response.data);

		} catch (error) {
			console.error('Error loading KRS:', error);
		} finally {
			isLoading.set(false);
		}
	}
	// Helper functions
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'approved': return 'bg-green-100 text-green-800';
			case 'rejected': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
 interface ranking {
  semester: string;
	nama_matahasiswa: string;
	kode: string;
	nama_mata_kuliah: string;
	sks: number;
	nilai_angka: string;
	nilai_huruf: string;
	peringkat: string;
	ipk: number;
	total_sks_lulus: number;
	total_sks_tidak_lulus: number;
}
export const rankList = writable<ranking[]>([]);

  async function getRanking(){
		try {
    isLoading.set(true);
    const response = await apiCall('/krs/ranking',{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

    if (!response.success) {
      throw new Error('Gagal mengambil data ranking');
    }
		console.log('DATA RANKING DARI API:', response.data); // ✅ debug
    rankList.set(response.data);

		} catch (error) {
			console.error('Error loading KRS:', error);
		} finally {
			isLoading.set(false);
		}
	}
	// Initialize data
	onMount(() => {
		getRanking();
		fetchCourses();
		loadProfile();
		loadKRS();
		loadAvailableCourses();
		loadLetterRequests();
		getGrades();
	});

	function refreshDiv() {
    loadKRS(); // ini akan reload data
  }
</script>


<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
	<!-- Header with glassmorphism effect -->
	<header class="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg shadow-blue-500/5">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-20">
				<div class="flex items-center space-x-4">
					<div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
						</svg>
					</div>
					<div>
						<h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
							Portal Mahasiswa
						</h1>
						<span class="text-sm text-slate-500">Nexis University</span>
					</div>
				</div>
				<div class="flex items-center space-x-6">
					{#if $student}
						<div class="flex items-center space-x-3">
							<div class="text-right hidden sm:block">
								<p class="text-sm font-medium text-slate-700">Selamat datang,</p>
								<p class="text-xs text-slate-500">{$student.nama}</p>
							</div>
							<img
								src={$student.photo || '/api/placeholder/40/40'}
								alt="Profile"
								class="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 shadow-md"
							/>
						</div>
						<button class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/25">
							Logout
						</button>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Modern Navigation with floating design -->
		<nav class="mb-10">
			<div class="flex flex-wrap gap-2 bg-white/60 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-xl shadow-blue-500/5 w-fit mx-auto">
				<button
					class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 {currentView === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}"
					on:click={() => currentView = 'dashboard'}
				>
					<div class="flex items-center space-x-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
						</svg>
						<span>Dashboard</span>
					</div>
				</button>
				<button
					class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 {currentView === 'profile' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}"
					on:click={() => currentView = 'profile'}
				>
					<div class="flex items-center space-x-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
						</svg>
						<span>Profil</span>
					</div>
				</button>
				<button
					class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 {currentView === 'krs' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}"
					on:click={() => currentView = 'krs'}
				>
					<div class="flex items-center space-x-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
						</svg>
						<span>KRS</span>
					</div>
				</button>
				<button
					class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 {currentView === 'grades' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}"
					on:click={() => currentView = 'grades'}
				>
					<div class="flex items-center space-x-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
						</svg>
						<span>Nilai</span>
					</div>
				</button>
				<button
					class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 {currentView === 'ranking' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}"
					on:click={() => currentView = 'ranking'}
				>
					<div class="flex items-center space-x-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
						</svg>
						<span>Ranking</span>
					</div>
				</button>
				<button
					class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 {currentView === 'letters' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'}"
					on:click={() => currentView = 'letters'}
				>
					<div class="flex items-center space-x-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
						<span>Surat Aktif</span>
					</div>
				</button>
			</div>
		</nav>

		<!-- Loading Indicator with modern animation -->
		{#if $isLoading}
			<div class="flex justify-center items-center py-20">
				<div class="relative">
					<div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-ping opacity-20"></div>
					<div class="absolute top-0 left-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse"></div>
				</div>
			</div>


		<!-- Dashboard View with modern cards -->
		{:else if currentView === 'dashboard'}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<!-- Profile Summary Card -->
				<div class="group hover:scale-105 transition-all duration-300">
					<div class="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 border border-white/20 p-8 hover:shadow-2xl hover:shadow-blue-500/20">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-xl font-bold text-slate-800">Profil Saya</h3>
							<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
								<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
								</svg>
							</div>
						</div>
						{#if $student}
							<div class="flex items-center gap-4 p-6 bg-gradient-to-br from-white/50 to-blue-50/50 rounded-2xl border border-white/30">
								<img
									src={$student.photo || '/api/placeholder/80/80'}
									alt="Profile"
									class="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-lg"
								/>
								<div class="space-y-2">
									<p class="text-lg font-bold text-slate-800">{$student.nama}</p>
									<p class="text-sm text-slate-600 font-medium">NIM: {$student.nim}</p>
									<div class="flex items-center space-x-2">
										<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
										<p class="text-sm text-slate-600">Semester {$student.semester}</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- KRS Summary Card -->
				<div class="group hover:scale-105 transition-all duration-300">
					<div class="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 border border-white/20 p-8 hover:shadow-2xl hover:shadow-blue-500/20">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-xl font-bold text-slate-800">KRS Aktif</h3>
							<div class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
								<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
								</svg>
							</div>
						</div>
						<div class="text-center">
								<div class="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
								{totalBaris}
								</div>
							<p class="text-slate-600 font-medium mb-4">Mata kuliah diambil</p>
							<div class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
								<p class="text-emerald-700 font-semibold">
									Total SKS: {totalSks} / 24
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Letter Requests Summary Card -->
				<div class="group hover:scale-105 transition-all duration-300">
					<div class="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 border border-white/20 p-8 hover:shadow-2xl hover:shadow-blue-500/20">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-xl font-bold text-slate-800">Pengajuan Surat</h3>
							<div class="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
								<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
							</div>
						</div>
						<div class="space-y-4">
							<div class="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-100">
								<span class="text-slate-700 font-medium">Pending:</span>
								<span class="text-2xl font-bold text-yellow-600">
									{$letterRequests.filter(l => l.status === 'pending').length}
								</span>
							</div>
							<div class="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
								<span class="text-slate-700 font-medium">Disetujui:</span>
								<span class="text-2xl font-bold text-green-600">
									{$letterRequests.filter(l => l.status === 'approved').length}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>


		<!-- Profile View with modern layout -->
		{:else if  currentView === 'profile'}
		<!-- Profile Section -->
			<div class="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 border border-white/20 overflow-hidden">
				<div class="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-white/20">
					<div class="flex justify-between items-center">
						<div>
							<h2 class="text-2xl font-bold text-slate-800">Profil Mahasiswa</h2>
							<p class="text-slate-600 mt-1">Kelola informasi pribadi Anda</p>
						</div>
						<button
							class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
							on:click={() => showEditProfile = true}
						>
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
								</svg>
								<span>Edit Profil</span>
							</div>
						</button>
					</div>
				</div>

				{#if $student}
					<div class="p-8">
						<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
							<div class="lg:col-span-2 space-y-6">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div class="space-y-2">
										<label class="block text-sm font-semibold text-slate-700">Nama Lengkap</label>
										<div class="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
											<p class="text-slate-800 font-medium">{$student.nama}</p>
										</div>
									</div>
									<div class="space-y-2">
										<label class="block text-sm font-semibold text-slate-700">NIM</label>
										<div class="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
											<p class="text-slate-800 font-medium">{$student.nim}</p>
										</div>
									</div>
									<div class="space-y-2">
										<label class="block text-sm font-semibold text-slate-700">Email</label>
										<div class="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
											<p class="text-slate-800 font-medium">{$student.email}</p>
										</div>
									</div>
									<div class="space-y-2">
										<label class="block text-sm font-semibold text-slate-700">Program Studi</label>
										<div class="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
											<p class="text-slate-800 font-medium">{$student.jenjang} {$student.program_nama}</p>
										</div>
									</div>
									<div class="space-y-2">
										<label class="block text-sm font-semibold text-slate-700">Nomor HP</label>
										<div class="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
											<p class="text-slate-800 font-medium">{$student.nomor_telepon}</p>
										</div>
									</div>
									<div class="space-y-2">
										<label class="block text-sm font-semibold text-slate-700">Semester</label>
										<div class="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
											<p class="text-slate-800 font-medium">Semester {$student.semester}</p>
										</div>
									</div>
								</div>
								<div class="space-y-2">
									<label class="block text-sm font-semibold text-slate-700">Alamat</label>
									<div class="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
										<p class="text-slate-800 font-medium">{$student.alamat}</p>
									</div>
								</div>
							</div>
							<div class="space-y-4">
								<label class="block text-sm font-semibold text-slate-700">Foto Profil</label>
								<div class="flex justify-center">
									<img
										src={$student.photo}
										alt="Profile"
										class="w-48 h-48 rounded-3xl object-cover ring-4 ring-white shadow-2xl"
									>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>


		<!-- KRS View with modern table -->
		{:else if currentView === 'krs'}
			<div class="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 border border-white/20 overflow-hidden">
				<div class="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-white/20">
					<div class="flex justify-between items-center">
						<div>
							<h2 class="text-2xl font-bold text-slate-800">Kartu Rencana Studi (KRS)</h2>
							<p class="text-slate-600 mt-1">Kelola mata kuliah yang Anda ambil</p>
						</div>
						<button
							class="absolute right-65 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
							on:click={() => window.location.reload()}
						>
						 refresh
						</button>

						<button
							class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
							on:click={() => showAddCourse = true}
						>
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
								</svg>
								<span>Tambah Mata Kuliah</span>
							</div>
						</button>
					</div>
				</div>

				<div class="overflow-x-auto">
					<table class="min-w-full">
						<thead>
							<tr class="bg-gradient-to-r from-slate-50 to-gray-50">
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Kode MK</th>
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Mata Kuliah</th>
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">SKS</th>
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Dosen</th>
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Jadwal</th>
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each $courses as course}
								<tr class="hover:bg-blue-50/50 transition-colors duration-200">
									<td class="px-8 py-6 whitespace-nowrap">
										<span class="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-semibold rounded-xl">
											{course.kode}
										</span>
									</td>
									<td class="px-8 py-6 text-slate-800 font-medium">
										{course.nama_mata_kuliah}
									</td>
									<td class="px-8 py-6">
										<span class="px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-sm font-semibold rounded-xl">
											{course.sks} SKS
										</span>
									</td>
									<td class="px-8 py-6 text-slate-700">
										{course.nama_dosen}
									</td>
									<td class="px-8 py-6 text-slate-700">
										{course.jadwal}
									</td>
									<td class="px-8 py-6">
										<button
											class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105"
											on:click={() => $student && removeCourseFromKRS(course.mata_kuliah_id, $student.pengguna_id)}
										>
											Hapus
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if $courses.length == 0}
					<div class="text-center py-16">
						<div class="w-16 h-16 bg-gradient-to-br from-slate-200 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
							</svg>
						</div>
						<p class="text-slate-500 text-lg">Belum ada mata kuliah yang diambil</p>
						<p class="text-slate-400 text-sm mt-2">Klik tombol "Tambah Mata Kuliah" untuk memulai</p>
					</div>
				{/if}
			</div>


		<!-- Grades View -->
		{:else if currentView === 'grades'}
			<div class="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 border border-white/20 overflow-hidden">
				<div class="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-white/20">
					<div class="flex justify-between items-center">
						<div>
							<h2 class="text-2xl font-bold text-slate-800">Nilai Akademik</h2>
							<p class="text-slate-600 mt-1">Lihat hasil studi dan prestasi akademik Anda</p>
						</div>
						<div class="flex items-center space-x-4">
							<div class="text-right">
								<p class="text-sm text-slate-600">IPK </p>
								<p class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{ipk}</p>
							</div>
						</div>
					</div>
				</div>


				<div class="p-8">
					{#if $gradeList.length > 0 }
					<div class="mb-8">
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							<div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-emerald-600 text-sm font-semibold">IPK Semester</p>
										<p class="text-2xl font-bold text-emerald-700">{ipk}</p>
									</div>
									<div class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
										<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
										</svg>
									</div>
								</div>
							</div>
							<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-blue-600 text-sm font-semibold">SKS Lulus</p>
										<p class="text-2xl font-bold text-blue-700">{totalSk_lulus}</p>
									</div>
									<div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
										<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
									</div>
								</div>
							</div>
							<div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-amber-600 text-sm font-semibold">SKS Tidak Lulus</p>
										<p class="text-2xl font-bold text-amber-700">{totalSk_tidak_lulus}</p>
									</div>
									<div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
										<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
										</svg>
									</div>
								</div>
							</div>
							<div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-purple-600 text-sm font-semibold">Semester</p>
										<p class="text-2xl font-bold text-purple-700">{semester}</p>
									</div>
									<div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
										<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>
					{/if}
					<div class="overflow-x-auto">
						<table class="min-w-full">
							<thead>
								<tr class="bg-gradient-to-r from-slate-50 to-gray-50">
									<th class="px-8 py-4  underline decoration-blue-500 underline-offset-10 font-bold text-left text-x10 font-bold text-slate-600 uppercase tracking-wider">Semester</th>
									<th class="px-8 py-4 underline decoration-blue-500 underline-offset-10 font-bold text-left text-x10 font-bold text-slate-600 uppercase tracking-wider">Kode MK</th>
									<th class="px-8 underline decoration-blue-500 underline-offset-10 font-bold py-4 text-left text-x10 font-bold text-slate-600 uppercase tracking-wider">Mata Kuliah</th>
									<th class="px-8 underline decoration-blue-500 underline-offset-10 font-bold py-4 text-left text-x10 font-bold text-slate-600 uppercase tracking-wider">SKS</th>
									<th class="px-8 py-4 underline decoration-blue-500 underline-offset-10 font-bold text-left text-x10 font-bold text-slate-600 uppercase tracking-wider">Nilai</th>
									<th class="px-8 py-4 underline decoration-blue-500 underline-offset-10 font-bold text-left text-x10 font-bold text-slate-600 uppercase tracking-wider">Grade</th>
								</tr>
							</thead>
							{#each $gradeList as grade}
							<tbody class="divide-y divide-slate-100">
								<tr class="hover:bg-blue-50/50 transition-colors duration-200">
									<td class="px-3 py-4 ">
										<span class="px-6 py-1 mr-10 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 text-sm font-semibold rounded-xl">
											Semester {grade.semester}
										</span>
									</td>
									<td class="px-10 py-6">
										<span class="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-semibold rounded-xl">
											{grade.kode}
										</span>
									</td>
									<td class="px-8 py-6 text-slate-800 font-medium">{grade.nama_mata_kuliah}</td>
									<td class="px-5 py-1">
										<span class="px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-sm font-semibold rounded-xl">
											{grade.sks} SKS
										</span>
									</td>
									<td class="px-11 py-6 text-slate-700 font-bold">{grade.nilai_angka}</td>
									<td class="px-10 py-6">
										<span class="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-xl">
											{grade.nilai_huruf}
										</span>
									</td>
								</tr>
							</tbody>
							{/each}
						</table>
					</div>
				</div>
			</div>


		<!-- Ranking View -->
		{:else if currentView === 'ranking'}
			<div class="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 border border-white/20 overflow-hidden">
				<div class="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-white/20">
					<div class="flex justify-between items-center">
						<div>
							<h2 class="text-2xl font-bold text-slate-800">Ranking Mahasiswa</h2>
							<p class="text-slate-600 mt-1">Peringkat berdasarkan IPK dan prestasi akademik</p>
						</div>
						<div class="flex items-center space-x-4">
							<div class="text-right">
								<p class="text-sm text-slate-600">Peringkat Anda</p>
								<p class="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">#12</p>
							</div>
						</div>
					</div>
				</div>

				<div class="p-8">
					<!-- Top 3 Podium -->
					<div class="mb-10">
						<h3 class="text-lg font-bold text-slate-800 mb-6 text-center">🏆 Top 3 Mahasiswa Terbaik</h3>
						<div class="flex justify-center items-end space-x-4">
							<!-- 2nd Place -->
							<div class="text-center">
								<div class="w-24 h-32 bg-gradient-to-br from-slate-300 to-gray-400 rounded-2xl flex items-end justify-center p-4 mb-4 relative">
									<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
										2
									</div>
									<img src="/api/placeholder/60/60" alt="2nd" class="w-16 h-16 rounded-xl object-cover ring-2 ring-white">
								</div>
								<p class="font-bold text-slate-800 text-sm">Maria Santos</p>
								<p class="text-xs text-slate-600">IPK: 3.89</p>
							</div>

							<!-- 1st Place -->
							<div class="text-center">
								<div class="w-28 h-36 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-end justify-center p-4 mb-4 relative">
									<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
										👑
									</div>
									<img src="/api/placeholder/70/70" alt="1st" class="w-20 h-20 rounded-xl object-cover ring-4 ring-white shadow-lg">
								</div>
								<p class="font-bold text-slate-800">Ahmad Rizky</p>
								<p class="text-xs text-slate-600">IPK: 3.95</p>
							</div>

							<!-- 3rd Place -->
							<div class="text-center">
								<div class="w-24 h-28 bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl flex items-end justify-center p-4 mb-4 relative">
									<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
										3
									</div>
									<img src="/api/placeholder/60/60" alt="3rd" class="w-16 h-16 rounded-xl object-cover ring-2 ring-white">
								</div>
								<p class="font-bold text-slate-800 text-sm">Siti Nurhaliza</p>
								<p class="text-xs text-slate-600">IPK: 3.87</p>
							</div>
						</div>
					</div>

					<!-- Full Ranking Table -->
					<div class="overflow-x-auto">
						<table class="min-w-full">
							<thead>
								<tr class="bg-gradient-to-r from-slate-50 to-gray-50">
									<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Peringkat</th>
									<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Mahasiswa</th>
									<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">NIM</th>
									<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Program Studi</th>
									<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">IPK</th>
									<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">SKS Lulus</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								<tr class="bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 transition-colors duration-200">
									<td class="px-8 py-6">
										<div class="flex items-center space-x-2">
											<span class="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</span>
											<span class="text-lg">🏆</span>
										</div>
									</td>
									<td class="px-8 py-6">
										<div class="flex items-center space-x-3">
											<img src="/api/placeholder/40/40" alt="Ahmad" class="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-200">
											<span class="font-bold text-slate-800">Ahmad Rizky</span>
										</div>
									</td>
									<td class="px-8 py-6 text-slate-700">2021001001</td>
									<td class="px-8 py-6 text-slate-700">Teknik Informatika</td>
									<td class="px-8 py-6">
										<span class="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl">3.95</span>
									</td>
									<td class="px-8 py-6 text-slate-700">144</td>
								</tr>
								<tr class="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 transition-colors duration-200">
									<td class="px-8 py-6">
										<div class="flex items-center space-x-2">
											<span class="w-8 h-8 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</span>
											<span class="text-lg">🥈</span>
										</div>
									</td>
									<td class="px-8 py-6">
										<div class="flex items-center space-x-3">
											<img src="/api/placeholder/40/40" alt="Maria" class="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200">
											<span class="font-bold text-slate-800">Maria Santos</span>
										</div>
									</td>
									<td class="px-8 py-6 text-slate-700">2021001002</td>
									<td class="px-8 py-6 text-slate-700">Teknik Informatika</td>
									<td class="px-8 py-6">
										<span class="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl">3.89</span>
									</td>
									<td class="px-8 py-6 text-slate-700">144</td>
								</tr>
								<tr class="bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors duration-200">
									<td class="px-8 py-6">
										<div class="flex items-center space-x-2">
											<span class="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center text-white font-bold text-sm">3</span>
											<span class="text-lg">🥉</span>
										</div>
									</td>
									<td class="px-8 py-6">
										<div class="flex items-center space-x-3">
											<img src="/api/placeholder/40/40" alt="Siti" class="w-10 h-10 rounded-full object-cover ring-2 ring-amber-200">
											<span class="font-bold text-slate-800">Siti Nurhaliza</span>
										</div>
									</td>
									<td class="px-8 py-6 text-slate-700">2021001003</td>
									<td class="px-8 py-6 text-slate-700">Sistem Informasi</td>
									<td class="px-8 py-6">
										<span class="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl">3.87</span>
									</td>
									<td class="px-8 py-6 text-slate-700">140</td>
								</tr>
								<tr class="hover:bg-blue-50/50 transition-colors duration-200">
									<td class="px-8 py-6">
										<span class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">12</span>
									</td>
									<td class="px-8 py-6">
										<div class="flex items-center space-x-3">
											<img src={$student?.photo || '/api/placeholder/40/40'} alt="You" class="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200">
											<div>
												<span class="font-bold text-slate-800">{$student?.nama || 'Anda'}</span>
												<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">You</span>
											</div>
										</div>
									</td>
									<td class="px-8 py-6 text-slate-700">{$student?.nim || '2021001012'}</td>
									<td class="px-8 py-6 text-slate-700">Teknik Informatika</td>
									<td class="px-8 py-6">
										<span class="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl">3.75</span>
									</td>
									<td class="px-8 py-6 text-slate-700">108</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

		<!-- Letter Requests View -->
		{:else if currentView === 'letters'}
			<div class="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 border border-white/20 overflow-hidden">
				<div class="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-white/20">
					<div class="flex justify-between items-center">
						<div>
							<h2 class="text-2xl font-bold text-slate-800">Pengajuan Surat Aktif Kuliah</h2>
							<p class="text-slate-600 mt-1">Kelola pengajuan surat keterangan aktif kuliah</p>
						</div>
						<button
							class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
							on:click={() => showAddLetter = true}
						>
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
								</svg>
								<span>Ajukan Surat Baru</span>
							</div>
						</button>
					</div>
				</div>

				<div class="overflow-x-auto">
					<table class="min-w-full">
						<thead>
							<tr class="bg-gradient-to-r from-slate-50 to-gray-50">
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tanggal Pengajuan</th>
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Keperluan</th>
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
								<th class="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each $letterRequests as letter}
								<tr class="hover:bg-blue-50/50 transition-colors duration-200">
									<td class="px-8 py-6 text-slate-700 font-medium">
										{formatDate(letter.created_at)}
									</td>
									<td class="px-8 py-6">
										{#if editingLetter?.id === letter.id}
											<input
												type="text"
												bind:value={letter.keperluan}
												class="w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
											>
										{:else}
											<p class="text-slate-800 font-medium">{letter.keperluan}</p>
										{/if}
									</td>
									<td class="px-8 py-6">
										<span class="px-4 py-2 text-xs font-bold rounded-2xl {getStatusColor(letter.status)}">
											{letter.status}
										</span>
									</td>
									<td class="px-8 py-6">
										<div class="flex space-x-3">
											{#if letter.status === 'menunggu'}
												{#if editingLetter?.id === letter.id}
													<button
														class="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/25"
														on:click={() => updateLetterRequest(letter.id, letter.keperluan)}
													>
														<div class="flex items-center space-x-1">
															<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
															</svg>
															<span>Simpan</span>
														</div>
													</button>
													<button
														class="bg-gradient-to-r from-slate-400 to-gray-500 hover:from-slate-500 hover:to-gray-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-slate-500/25"
														on:click={() => editingLetter = null}
													>
														<div class="flex items-center space-x-1">
															<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
															</svg>
															<span>Batal</span>
														</div>
													</button>
												{:else}
													<button
														class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
														on:click={() => editingLetter = { ...letter }}
													>
														<div class="flex items-center space-x-1">
															<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
															</svg>
															<span>Edit</span>
														</div>
													</button>
												{/if}
												<button
													class="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/25"
													on:click={() => deleteLetterRequest(letter.id)}
												>
													<div class="flex items-center space-x-1">
														<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
														</svg>
														<span>Hapus</span>
													</div>
												</button>
											{:else}
												<div class="flex items-center justify-center bg-gradient-to-r from-slate-100 to-gray-100 px-4 py-2 rounded-xl">
													<span class="text-slate-400 text-sm font-medium">No Actions Available</span>
												</div>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if $letterRequests.length === 0}
					<div class="text-center py-16">
						<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-4">
							<svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-slate-800 mb-2">Belum Ada Pengajuan Surat</h3>
						<p class="text-slate-600 mb-6">Mulai ajukan surat aktif kuliah pertama Anda</p>
						<button
							class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
							on:click={() => showAddLetter = true}
						>
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
								</svg>
								<span>Ajukan Surat Pertama</span>
							</div>
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Edit Profile Modal -->
	{#if showEditProfile}
	<div class="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
		<div class="relative bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-blue-500/20 rounded-3xl w-full max-w-2xl transform transition-all duration-300">
			<div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
			<div class="relative">
				<!-- Header -->
				<div class="px-8 py-6 border-b border-slate-200/50">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
								</svg>
							</div>
							<div>
								<h3 class="text-xl font-bold text-slate-800">Edit Profil</h3>
								<p class="text-slate-600 text-sm">Perbarui informasi profil Anda</p>
							</div>
						</div>
						<button
							class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200 flex items-center justify-center"
							on:click={() => showEditProfile = false}
						>
							<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>

				<!-- Content -->
				<div class="px-8 py-6">
					<form on:submit|preventDefault={updateProfile}>
						<div class="space-y-6">
							<div class="group">
								<label class="block text-sm font-semibold text-slate-700 mb-2">
									<div class="flex items-center space-x-2">
										<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
										</svg>
										<span>Nomor HP</span>
									</div>
								</label>
								<input
									type="text"
									bind:value={profileForm.nomor_telepon}
									class="w-full px-4 py-3 bg-white/70 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
									placeholder="Masukkan nomor HP"
								>
							</div>

							<div class="group">
								<label class="block text-sm font-semibold text-slate-700 mb-2">
									<div class="flex items-center space-x-2">
										<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
										</svg>
										<span>Alamat</span>
									</div>
								</label>
								<textarea
									bind:value={profileForm.alamat}
									rows="3"
									class="w-full px-4 py-3 bg-white/70 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 resize-none"
									placeholder="Masukkan alamat lengkap"
								></textarea>
							</div>

							<div class="group">
								<label class="block text-sm font-semibold text-slate-700 mb-2">
									<div class="flex items-center space-x-2">
										<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
										</svg>
										<span>URL Foto Profil</span>
									</div>
								</label>
								<input
									type="url"
									bind:value={profileForm.photo}
									class="w-full px-4 py-3 bg-white/70 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
									placeholder="https://example.com/photo.jpg"
								>
							</div>
						</div>

						<!-- Footer Actions -->
						<div class="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200/50">
							<button
								type="button"
								class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105"
								on:click={() => showEditProfile = false}
							>
								<div class="flex items-center space-x-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
									</svg>
									<span>Batal</span>
								</div>
							</button>
							<button
								type="submit"
								class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
							>
								<div class="flex items-center space-x-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
									</svg>
									<span>Simpan Perubahan</span>
								</div>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Add Course Modal -->
{#if showAddCourse}
	<div class="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
		<div class="relative bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-blue-500/20 rounded-3xl w-full max-w-6xl transform transition-all duration-300">
			<div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
			<div class="relative">
				<!-- Header -->
				<div class="px-8 py-6 border-b border-slate-200/50">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
								</svg>
							</div>
							<div>
								<h3 class="text-xl font-bold text-slate-800">Tambah Mata Kuliah</h3>
								<p class="text-slate-600 text-sm">Pilih mata kuliah yang ingin ditambahkan ke KRS</p>
							</div>
						</div>
						<button
							class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200 flex items-center justify-center"
							on:click={() => showAddCourse = false}
						>
							<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>

				<!-- Content -->
				<div class="px-8 py-6">
					<div class="bg-white/50 rounded-2xl border border-slate-200/50 overflow-hidden">
						<div class="overflow-x-auto max-h-96">
							<table class="min-w-full">
								<thead>
									<tr class="bg-gradient-to-r from-slate-50 to-gray-50">
										<th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Kode</th>
										<th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Mata Kuliah</th>
										<th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">SKS</th>
										<th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Dosen</th>
										<th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Jadwal</th>
										<th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each $krsList as krs}
										<tr class="hover:bg-blue-50/50 transition-colors duration-200">
											<td class="px-6 py-4 text-sm font-bold text-slate-800">{krs.kode}</td>
											<td class="px-6 py-4 text-sm font-medium text-slate-700">{krs.nama_matakuliah}</td>
											<td class="px-6 py-4 text-sm text-slate-600">
												<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">{krs.sks} SKS</span>
											</td>
											<td class="px-6 py-4 text-sm text-slate-700">{krs.nama_dosen}</td>
											<td class="px-6 py-4 text-sm text-slate-600">{krs.jadwal}</td>
											<td class="px-6 py-4">
												<button
													class="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-300 disabled:to-slate-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/25 disabled:shadow-none disabled:transform-none"
													on:click={() => addCourseToKRS(krs.matkul_id)}
													disabled={$isLoading}
												>
													{#if $isLoading}
														<div class="flex items-center space-x-2">
															<svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
																<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
																<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
															</svg>
															<span>Loading...</span>
														</div>
													{:else}
														<div class="flex items-center space-x-1">
															<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
															</svg>
															<span>Tambah</span>
														</div>
													{/if}
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Footer Actions -->
					<div class="flex justify-end mt-6 pt-6 border-t border-slate-200/50">
						<button
							class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105"
							on:click={() => showAddCourse = false}
						>
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
								<span>Tutup</span>
							</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Add Letter Request Modal -->
	{#if showAddLetter}
		<div class="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
			<div class="relative bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-blue-500/20 rounded-3xl w-full max-w-2xl transform transition-all duration-300">
				<div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-3xl"></div>
				<div class="relative">
					<!-- Header -->
					<div class="px-8 py-6 border-b border-slate-200/50">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
									<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
									</svg>
								</div>
								<div>
									<h3 class="text-xl font-bold text-slate-800">Ajukan Surat Aktif Kuliah</h3>
									<p class="text-slate-600 text-sm">Lengkapi form untuk mengajukan surat keterangan aktif kuliah</p>
								</div>
							</div>
							<button
								class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200 flex items-center justify-center"
								on:click={() => showAddLetter = false}
							>
								<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
							</button>
						</div>
					</div>

					<!-- Content -->
					<div class="px-8 py-6">
						<form on:submit|preventDefault={createLetterRequest}>
							<div class="space-y-6">
								<div class="group">
									<label class="block text-sm font-semibold text-slate-700 mb-2">
										<div class="flex items-center space-x-2">
											<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
											<span>Keperluan Surat</span>
											<span class="text-red-500">*</span>
										</div>
									</label>
									<div class="relative">
										<textarea
											bind:value={newLetterPurpose}
											rows="5"
											class="w-full px-4 py-3 bg-white/70 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 resize-none"
											placeholder="Jelaskan keperluan surat aktif kuliah Anda. Contoh: Untuk keperluan beasiswa, magang, atau administrasi lainnya..."
											required
										></textarea>
										<div class="absolute bottom-3 right-3 text-xs text-slate-400">
											{newLetterPurpose?.length || 0} karakter
										</div>
									</div>
									<div class="mt-2 flex items-start space-x-2 text-xs text-slate-500">
										<svg class="w-3 h-3 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
										<span>Pastikan Anda menjelaskan keperluan dengan jelas dan lengkap untuk mempercepat proses persetujuan.</span>
									</div>
								</div>
							</div>

							<!-- Footer Actions -->
							<div class="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200/50">
								<button
									type="button"
									class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105"
									on:click={() => showAddLetter = false}
								>
									<div class="flex items-center space-x-2">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
										</svg>
										<span>Batal</span>
									</div>
								</button>
								<button
									type="submit"
									class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/25 disabled:shadow-none disabled:transform-none"
									disabled={$isLoading}
								>
									{#if $isLoading}
										<div class="flex items-center space-x-2">
											<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											<span>Mengajukan...</span>
										</div>
									{:else}
										<div class="flex items-center space-x-2">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
											</svg>
											<span>Ajukan Sekarang</span>
										</div>
									{/if}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
