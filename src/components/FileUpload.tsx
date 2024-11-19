import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface FileUploadProps {
	onCatalogLoad: (file: File) => Promise<void>;
}

export function FileUpload({ onCatalogLoad }: FileUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setIsUploading(true);
			await onCatalogLoad(file);
		} catch (error) {
			console.error('Upload failed:', error);
		} finally {
			setIsUploading(false);
		}
	};

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true);
		} else if (e.type === 'dragleave') {
			setDragActive(false);
		}
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const file = e.dataTransfer?.files?.[0];
		if (!file || !file.name.toLowerCase().endsWith('.json')) return;

		try {
			setIsUploading(true);
			await onCatalogLoad(file);
		} catch (error) {
			console.error('Upload failed:', error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="w-full max-w-xl">
			<label
				htmlFor="file-upload"
				className={`flex flex-col items-center justify-center w-full h-64 border-2 ${
					dragActive
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-300 bg-gray-50'
				} ${
					isUploading ? 'cursor-not-allowed' : 'cursor-pointer'
				} border-dashed rounded-lg hover:bg-gray-100 transition-colors duration-300`}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}>
				<div className="flex flex-col items-center justify-center pt-5 pb-6">
					{isUploading ? (
						<>
							<Loader2 className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
							<p className="mb-2 text-sm text-gray-500">
								Uploading and indexing catalog...
							</p>
							<p className="text-xs text-gray-500">
								This may take a moment
							</p>
						</>
					) : (
						<>
							<Upload className="w-12 h-12 mb-4 text-gray-500" />
							<p className="mb-2 text-sm text-gray-500">
								<span className="font-semibold">
									Click to upload
								</span>{' '}
								or drag and drop
							</p>
							<p className="text-xs text-gray-500">
								JSON catalog file
							</p>
						</>
					)}
				</div>
				<input
					id="file-upload"
					type="file"
					className="hidden"
					accept=".json"
					onChange={handleFileChange}
					disabled={isUploading}
				/>
			</label>
		</div>
	);
}
