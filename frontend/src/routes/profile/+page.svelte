<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';


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
	let currentView = 'dashboard';
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
    }
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
	}

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
  interface ListKrs {
  id: number;
  program_id: number;
  kode: string;
  nama_mata_kuliah: string;
  sks: number;
  jadwal: string;
  nama_dosen: string;
  mata_kuliah_id: number;
  mahasiswa_id: number;
}

export const krsList = writable<ListKrs[]>([]);
export const iskrsLoading = writable(false);

// KRS Functions
async function loadKRS() {
  try {
    iskrsLoading.set(true);
    const response = await apiCall('/krs');

    if (!response.success) {
      throw new Error('Gagal mengambil data KRS');
    }

    krsList.set(response.data);
  } catch (error) {
    console.error('Error loading KRS:', error);
  } finally {
    iskrsLoading.set(false);
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


	async function addCourseToKRS(courseId: string) {
		try {
			isLoading.set(true);
			await apiCall('/krs', {
				method: 'POST',
				body: JSON.stringify({ course_id: courseId })
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
			await apiCall('/pengajuan', {
				method: 'POST',
				body: JSON.stringify({
					jenis_surat: 'surat_aktif_kuliah',
					keperluan: newLetterPurpose
				})
			});
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

	// Initialize data
	onMount(() => {
		fetchCourses();
		loadProfile();
		loadKRS();
		loadAvailableCourses();
		loadLetterRequests();
	});
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-blue-600 text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<h1 class="text-xl font-bold">Portal Mahasiswa</h1>
					<span class="ml-2 text-blue-200">Nexis University</span>
				</div>
				<div class="flex items-center space-x-4">
					{#if $student}
						<span class="text-sm">Selamat datang, {$student.nama}</span>
						<button class="bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded text-sm">
							Logout
						</button>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Navigation -->
		<nav class="mb-8">
			<div class="flex space-x-1 bg-blue-100 p-1 rounded-lg w-fit">
				<button
					class="px-4 py-2 rounded-md text-sm font-medium transition-colors {currentView === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:text-blue-700'}"
					on:click={() => currentView = 'dashboard'}
				>
					Dashboard
				</button>
				<button
					class="px-4 py-2 rounded-md text-sm font-medium transition-colors {currentView === 'profile' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:text-blue-700'}"
					on:click={() => currentView = 'profile'}
				>
					Profil
				</button>
				<button
					class="px-4 py-2 rounded-md text-sm font-medium transition-colors {currentView === 'krs' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:text-blue-700'}"
					on:click={() => currentView = 'krs'}
				>
					KRS
				</button>
				<button
					class="px-4 py-2 rounded-md text-sm font-medium transition-colors {currentView === 'letters' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:text-blue-700'}"
					on:click={() => currentView = 'letters'}
				>
					Surat Aktif Kuliah
				</button>
			</div>
		</nav>

		<!-- Loading Indicator -->
		{#if $isLoading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		{/if}

		<!-- Dashboard View -->
		{#if currentView === 'dashboard'}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Profile Summary -->
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Profil Saya</h3>
					{#if $student}
						<div class="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
								<img
									src={$student.photo || '/api/placeholder/64/64'}
									alt="Profile"
									class="w-16 h-16 rounded-full object-cover border border-gray-200"
								/>
								<div class="space-y-1">
									<p class="text-lg font-semibold text-gray-800">{$student.nama}</p>
									<p class="text-sm text-gray-600">NIM: {$student.nim}</p>
									<p class="text-sm text-gray-600">Semester: {$student.semester}</p>
								</div>
							</div>
					{/if}
				</div>

				<!-- KRS Summary -->
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">KRS Aktif</h3>
					<div class="text-3xl font-bold text-blue-600">{$krsList.length}</div>
					<p class="text-sm text-gray-500">Mata kuliah diambil</p>
					<div class="mt-4">
						<p class="text-sm text-gray-600">
							Total SKS: {$krsList.reduce((sum, item) => sum + item.course.credits, 0)}
						</p>
					</div>
				</div>

				<!-- Letter Requests Summary -->
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Pengajuan Surat</h3>
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Pending:</span>
							<span class="text-sm font-medium text-yellow-600">
								{$letterRequests.filter(l => l.status === 'pending').length}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Disetujui:</span>
							<span class="text-sm font-medium text-green-600">
								{$letterRequests.filter(l => l.status === 'approved').length}
							</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Profile View -->
		{#if currentView === 'profile'}
			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex justify-between items-center">
						<h2 class="text-xl font-semibold text-gray-900">Profil Mahasiswa</h2>
						<button
							class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
							on:click={() => showEditProfile = true}
						>
							Edit Profil
						</button>
					</div>
				</div>

				{#if $student}
					<div class="p-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="space-y-4">
								<div>
									<label class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
									<p class="mt-1 text-sm text-gray-900">{$student.nama}</p>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700">NIM</label>
									<p class="mt-1 text-sm text-gray-900">{$student.nim}</p>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700">Email</label>
									<p class="mt-1 text-sm text-gray-900">{$student.email}</p>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700">Program Studi</label>
									<p class="mt-1 text-sm text-gray-900">{$student.jenjang} {$student.program_nama}</p>
								</div>
							</div>
							<div class="space-y-4">
								<div>
									<label class="block text-sm font-medium text-gray-700">Nomor HP</label>
									<p class="mt-1 text-sm text-gray-900">{$student.phone}</p>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700">Alamat</label>
									<p class="mt-1 text-sm text-gray-900">{$student.alamat}</p>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700">Semester</label>
									<p class="mt-1 text-sm text-gray-900">{$student.semester}</p>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700">Foto Profil</label>
									<img src={$student.photo || '/api/placeholder/128/128'} alt="Profile" class="mt-1 w-32 h-32 rounded-lg object-cover">
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- KRS View -->
		{#if currentView === 'krs'}
			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex justify-between items-center">
						<h2 class="text-xl font-semibold text-gray-900">Kartu Rencana Studi (KRS)</h2>
						<button
							class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
							on:click={() => showAddCourse = true}
						>
							Tambah Mata Kuliah
						</button>
					</div>
				</div>

				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode MK</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Kuliah</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKS</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosen</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jadwal</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each $courses as course}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{course.kode}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{course.nama_mata_kuliah}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{course.sks}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{course.nama_dosen}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{course.jadwal}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										<button
											class="text-red-600 hover:text-red-900"
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
					<div class="text-center py-12">
						<p class="text-gray-500">Belum ada mata kuliah yang diambil</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Letter Requests View -->
		{#if currentView === 'letters'}
			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex justify-between items-center">
						<h2 class="text-xl font-semibold text-gray-900">Pengajuan Surat Aktif Kuliah</h2>
						<button
							class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
							on:click={() => showAddLetter = true}
						>
							Ajukan Surat Baru
						</button>
					</div>
				</div>

				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pengajuan</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keperluan</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each $letterRequests as letter}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDate(letter.created_at)}
									</td>
									<td class="px-6 py-4 text-sm text-gray-900">
										{#if editingLetter?.id === letter.id}
											<input
												type="text"
												bind:value={letter.keperluan}
												class="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
											>
										{:else}
											{letter.keperluan}
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(letter.status)}">
											{letter.status}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										<div class="flex space-x-2">
											{#if letter.status === 'menunggu'}
												{#if editingLetter?.id === letter.mahasiswa_id}
													<button
														class="text-green-600 hover:text-green-900"
														on:click={() => updateLetterRequest(letter.id, letter.keperluan)}
													>
														Simpan
													</button>
													<button
														class="text-gray-600 hover:text-gray-900"
														on:click={() => editingLetter = null}
													>
														Batal
													</button>
												{:else}
													<button
														class="text-blue-600 hover:text-blue-900"
														on:click={() => editingLetter = { ...letter }}
													>
														Edit
													</button>
												{/if}
												<button
													class="text-red-600 hover:text-red-900"
													on:click={() => deleteLetterRequest(letter.id)}
												>
													Hapus
												</button>
											{:else}
												<span class="text-gray-400">-</span>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if $letterRequests.length === 0}
					<div class="text-center py-12">
						<p class="text-gray-500">Belum ada pengajuan surat</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Edit Profile Modal -->
	{#if showEditProfile}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Edit Profil</h3>
					<form on:submit|preventDefault={updateProfile}>
						<div class="grid grid-cols-1 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700">Nomor HP</label>
								<input
									type="text"
									bind:value={profileForm.phone}
									class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
								>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700">Alamat</label>
								<textarea
									bind:value={profileForm.address}
									rows="3"
									class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
								></textarea>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700">URL Foto Profil</label>
								<input
									type="url"
									bind:value={profileForm.photo}
									class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
								>
							</div>
						</div>
						<div class="flex justify-end space-x-3 mt-6">
							<button
								type="button"
								class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
								on:click={() => showEditProfile = false}
							>
								Batal
							</button>
							<button
								type="submit"
								class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
							>
								Simpan
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- Add Course Modal -->
	{#if showAddCourse}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 shadow-lg rounded-md bg-white">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Tambah Mata Kuliah</h3>
					<div class="overflow-x-auto max-h-96">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Mata Kuliah</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKS</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosen</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jadwal</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each $krsList as krs}
									<tr>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{krs.kode}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{krs.nama_matakuliah}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{krs.sks}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{krs.nama_dosen}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{krs.jadwal}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											<button
												class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
												on:click={() => addCourseToKRS(course.id)}
												disabled={$isLoading}
											>
												{$isLoading ? 'Loading...' : 'Tambah'}
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="flex justify-end mt-4">
						<button
							class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
							on:click={() => showAddCourse = false}
						>
							Tutup
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Add Letter Request Modal -->
	{#if showAddLetter}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Ajukan Surat Aktif Kuliah</h3>
					<form on:submit|preventDefault={createLetterRequest}>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Keperluan Surat</label>
							<textarea
								bind:value={newLetterPurpose}
								rows="4"
								class="w-full border border-gray-300 rounded-md px-3 py-2"
								placeholder="Masukkan keperluan surat aktif kuliah..."
								required
							></textarea>
						</div>
						<div class="flex justify-end space-x-3 mt-6">
							<button
								type="button"
								class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
								on:click={() => showAddLetter = false}
							>
								Batal
							</button>
							<button
								type="submit"
								class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
							>
								Ajukan
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
