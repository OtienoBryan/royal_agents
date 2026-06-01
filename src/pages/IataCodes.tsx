import { useState, useEffect } from 'react'
import { adminApiService, IataCode } from '../services/api'
import { Plane, Search, Edit, Trash2, Plus, Globe, X } from 'lucide-react'

interface IataCodeModalProps {
    isOpen: boolean
    onClose: () => void
    iataCode: IataCode | null
    onSave: (iataCodeData: Partial<IataCode>) => Promise<void>
}

const IataCodeModal: React.FC<IataCodeModalProps> = ({ isOpen, onClose, iataCode, onSave }) => {
    const [formData, setFormData] = useState<Partial<IataCode>>({
        code: '',
        icao: '',
        airport: '',
        city: '',
        country_code: '',
        region_name: '',
        latitude: null,
        longitude: null,
        status: 'active'
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen && iataCode) {
            setFormData({
                code: iataCode.code || '',
                icao: iataCode.icao || '',
                airport: iataCode.airport || '',
                city: iataCode.city || '',
                country_code: iataCode.country_code || '',
                region_name: iataCode.region_name || '',
                latitude: iataCode.latitude ? Number(iataCode.latitude) : null,
                longitude: iataCode.longitude ? Number(iataCode.longitude) : null,
                status: iataCode.status || 'active'
            })
        } else if (isOpen) {
            setFormData({
                code: '',
                icao: '',
                airport: '',
                city: '',
                country_code: '',
                region_name: '',
                latitude: null,
                longitude: null,
                status: 'active'
            })
        }
    }, [isOpen, iataCode])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error('Error saving IATA code:', error)
            alert('Failed to save IATA code')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        let newValue: any = value

        if (name === 'longitude' || name === 'latitude') {
            newValue = value === '' ? null : parseFloat(value)
        }

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-1.5">
                    <h2 className="text-sm font-semibold">
                        {iataCode ? 'Edit IATA Code' : 'Add New IATA Code'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-1.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">IATA Code *</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code || ''}
                                onChange={handleChange}
                                required
                                maxLength={3}
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent uppercase"
                                placeholder="e.g., JFK"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">ICAO Code</label>
                            <input
                                type="text"
                                name="icao"
                                value={formData.icao || ''}
                                onChange={handleChange}
                                maxLength={4}
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent uppercase"
                                placeholder="e.g., KJFK"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Airport Name *</label>
                            <input
                                type="text"
                                name="airport"
                                value={formData.airport || ''}
                                onChange={handleChange}
                                required
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., John F. Kennedy International Airport"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city || ''}
                                onChange={handleChange}
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., New York"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Country Code *</label>
                            <input
                                type="text"
                                name="country_code"
                                value={formData.country_code || ''}
                                onChange={handleChange}
                                required
                                maxLength={2}
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent uppercase"
                                placeholder="e.g., US"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Region</label>
                            <input
                                type="text"
                                name="region_name"
                                value={formData.region_name || ''}
                                onChange={handleChange}
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., New York"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Latitude</label>
                            <input
                                type="number"
                                step="0.0000001"
                                name="latitude"
                                value={formData.latitude || ''}
                                onChange={handleChange}
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="-90 to 90"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Longitude</label>
                            <input
                                type="number"
                                step="0.0000001"
                                name="longitude"
                                value={formData.longitude || ''}
                                onChange={handleChange}
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="-180 to 180"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Status *</label>
                            <select
                                name="status"
                                value={formData.status || 'active'}
                                onChange={handleChange}
                                required
                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-1 pt-1.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : iataCode ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

interface ImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImport: () => Promise<void>
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [importMethod, setImportMethod] = useState<'csv' | 'manual'>('csv')
    const [csvText, setCsvText] = useState('')
    const [manualCodes, setManualCodes] = useState<Partial<IataCode>[]>([
        { code: '', icao: '', airport: '', city: '', country_code: '', region_name: '', latitude: null, longitude: null, status: 'active' }
    ])
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<{ inserted: number, skipped: number } | null>(null)

    useEffect(() => {
        if (!isOpen) {
            setCsvText('')
            setManualCodes([{ code: '', icao: '', airport: '', city: '', country_code: '', region_name: '', latitude: null, longitude: null, status: 'active' }])
            setImportResult(null)
        }
    }, [isOpen])

    const parseCSV = (text: string): Partial<IataCode>[] => {
        const lines = text.split('\n').filter(line => line.trim())
        const codes: Partial<IataCode>[] = []

        // Skip header if present
        const startIndex = lines[0]?.toLowerCase().includes('code') || lines[0]?.toLowerCase().includes('iata') ? 1 : 0

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Parse CSV line (handling quoted fields)
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
            if (!matches || matches.length < 3) continue

            const cleanValue = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : ''

            // Expected format: code, icao, airport, city, country_code, region_name, latitude, longitude, status
            const code = cleanValue(matches[0] || '')
            const icao = matches[1] ? cleanValue(matches[1]) : ''
            const airport = cleanValue(matches[2] || '')
            const city = matches[3] ? cleanValue(matches[3]) : ''
            const country_code = matches[4] ? cleanValue(matches[4]) : ''
            const region_name = matches[5] ? cleanValue(matches[5]) : ''
            const latitude = matches[6] ? parseFloat(cleanValue(matches[6])) || null : null
            const longitude = matches[7] ? parseFloat(cleanValue(matches[7])) || null : null
            const status = matches[8] ? cleanValue(matches[8]) || 'active' : 'active'

            if (code && code.length === 3 && airport) {
                codes.push({
                    code: code.toUpperCase(),
                    icao: icao ? icao.toUpperCase() : null,
                    airport,
                    city: city || null,
                    country_code: country_code ? country_code.toUpperCase() : '',
                    region_name: region_name || null,
                    latitude,
                    longitude,
                    status: status || 'active'
                })
            }
        }

        return codes
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const text = event.target?.result as string
                setCsvText(text)
            }
            reader.readAsText(file)
        }
    }

    const handleAddManualRow = () => {
        setManualCodes([...manualCodes, { code: '', icao: '', airport: '', city: '', country_code: '', region_name: '', latitude: null, longitude: null, status: 'active' }])
    }

    const handleRemoveManualRow = (index: number) => {
        setManualCodes(manualCodes.filter((_, i) => i !== index))
    }

    const handleManualCodeChange = (index: number, field: keyof IataCode, value: any) => {
        const updated = [...manualCodes]
        updated[index] = { ...updated[index], [field]: value }
        setManualCodes(updated)
    }

    const handleImport = async () => {
        try {
            setImporting(true)
            setImportResult(null)

            let codesToImport: Partial<IataCode>[] = []

            if (importMethod === 'csv') {
                if (!csvText) {
                    alert('Please upload a CSV file or enter CSV text')
                    return
                }
                codesToImport = parseCSV(csvText)
            } else {
                // Manual entry
                codesToImport = manualCodes
                    .filter(code => code.code && code.code.length === 3 && code.airport && code.country_code)
                    .map(code => ({
                        ...code,
                        code: code.code?.toUpperCase(),
                        icao: code.icao ? code.icao.toUpperCase() : null,
                        country_code: code.country_code?.toUpperCase(),
                        latitude: code.latitude ? Number(code.latitude) : null,
                        longitude: code.longitude ? Number(code.longitude) : null,
                        status: code.status || 'active'
                    }))
            }

            if (codesToImport.length === 0) {
                alert('No valid IATA codes to import')
                return
            }

            // Call the API directly to get the result
            const result = await adminApiService.bulkInsertIataCodes(codesToImport)
            setImportResult(result)
            
            // Call the onImport callback to refresh the list
            await onImport()
            
            if (result.inserted > 0) {
                // Close modal after successful import
                setTimeout(() => {
                    onClose()
                }, 2000)
            }
        } catch (error) {
            console.error('Error importing IATA codes:', error)
            alert('Failed to import IATA codes')
        } finally {
            setImporting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-2 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-1.5">
                    <h2 className="text-sm font-semibold">Import Available IATA Codes</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="mb-2">
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => setImportMethod('csv')}
                            className={`px-2 py-1 text-[11px] rounded ${importMethod === 'csv' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            CSV Import
                        </button>
                        <button
                            onClick={() => setImportMethod('manual')}
                            className={`px-2 py-1 text-[11px] rounded ${importMethod === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Manual Entry
                        </button>
                    </div>

                    {importMethod === 'csv' ? (
                        <div className="space-y-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Upload CSV File</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Or Paste CSV Text</label>
                                <textarea
                                    value={csvText}
                                    onChange={(e) => setCsvText(e.target.value)}
                                    placeholder="code,icao,airport,city,country_code,region_name,latitude,longitude,status&#10;JFK,KJFK,John F. Kennedy International Airport,New York,US,New York,40.6413,-73.7781,active"
                                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded h-32 font-mono"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500">
                                CSV format: code,icao,airport,city,country_code,region_name,latitude,longitude,status
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded p-1">
                                {manualCodes.map((code, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-1 mb-1 p-1 bg-gray-50 rounded">
                                        <input
                                            type="text"
                                            placeholder="Code*"
                                            value={code.code || ''}
                                            onChange={(e) => handleManualCodeChange(index, 'code', e.target.value)}
                                            maxLength={3}
                                            className="col-span-1 px-1 py-0.5 text-[10px] border border-gray-300 rounded uppercase"
                                        />
                                        <input
                                            type="text"
                                            placeholder="ICAO"
                                            value={code.icao || ''}
                                            onChange={(e) => handleManualCodeChange(index, 'icao', e.target.value)}
                                            maxLength={4}
                                            className="col-span-1 px-1 py-0.5 text-[10px] border border-gray-300 rounded uppercase"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Airport*"
                                            value={code.airport || ''}
                                            onChange={(e) => handleManualCodeChange(index, 'airport', e.target.value)}
                                            className="col-span-3 px-1 py-0.5 text-[10px] border border-gray-300 rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={code.city || ''}
                                            onChange={(e) => handleManualCodeChange(index, 'city', e.target.value)}
                                            className="col-span-2 px-1 py-0.5 text-[10px] border border-gray-300 rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Country*"
                                            value={code.country_code || ''}
                                            onChange={(e) => handleManualCodeChange(index, 'country_code', e.target.value)}
                                            maxLength={2}
                                            className="col-span-1 px-1 py-0.5 text-[10px] border border-gray-300 rounded uppercase"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Region"
                                            value={code.region_name || ''}
                                            onChange={(e) => handleManualCodeChange(index, 'region_name', e.target.value)}
                                            className="col-span-2 px-1 py-0.5 text-[10px] border border-gray-300 rounded"
                                        />
                                        <button
                                            onClick={() => handleRemoveManualRow(index)}
                                            className="col-span-1 px-1 py-0.5 text-[10px] bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            <X className="h-2.5 w-2.5 mx-auto" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddManualRow}
                                className="px-2 py-1 text-[11px] bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                + Add Row
                            </button>
                        </div>
                    )}

                    {importResult && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-[11px]">
                            <p className="font-semibold">Import Results:</p>
                            <p>Inserted: {importResult.inserted}</p>
                            <p>Skipped (duplicates): {importResult.skipped}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-1 pt-1.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        disabled={importing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importing ? 'Importing...' : 'Import Codes'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const IataCodes: React.FC = () => {
    const [iataCodes, setIataCodes] = useState<IataCode[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [editingIataCode, setEditingIataCode] = useState<IataCode | null>(null)
    const [limit, setLimit] = useState(10)

    useEffect(() => {
        fetchIataCodes()
    }, [page, searchTerm, limit])

    const fetchIataCodes = async () => {
        try {
            console.log('🔍 [IataCodes] Fetching IATA codes...', { page, limit, searchTerm })
            setLoading(true)
            const result = await adminApiService.getIataCodes(page, limit, searchTerm)
            console.log('✅ [IataCodes] API Response:', result)
            console.log('✅ [IataCodes] IATA Codes:', result.iataCodes)
            console.log('✅ [IataCodes] Total:', result.total)
            setIataCodes(result.iataCodes || [])
            setTotal(result.total || 0)
        } catch (error) {
            console.error('❌ [IataCodes] Error fetching IATA codes:', error)
            setIataCodes([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (iataCode: IataCode) => {
        setEditingIataCode(iataCode)
        setIsModalOpen(true)
    }

    const handleCreate = () => {
        setEditingIataCode(null)
        setIsModalOpen(true)
    }

    const handleSave = async (iataCodeData: Partial<IataCode>) => {
        try {
            if (editingIataCode) {
                await adminApiService.updateIataCode(editingIataCode.id, iataCodeData)
            } else {
                await adminApiService.createIataCode(iataCodeData)
            }
            await fetchIataCodes()
        } catch (error) {
            console.error('Error saving IATA code:', error)
            throw error
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this IATA code?')) return

        try {
            await adminApiService.deleteIataCode(id)
            await fetchIataCodes()
        } catch (error) {
            console.error('Error deleting IATA code:', error)
            alert('Failed to delete IATA code')
        }
    }

    const activeCount = iataCodes.filter(c => c.status === 'active').length

    if (loading && iataCodes.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-2">
                <div className="w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <div className="w-full">
                <div className="mb-2 flex justify-between items-center">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                            <Plane className="h-3.5 w-3.5 text-blue-600" />
                            IATA Airport Codes
                        </h1>
                        <p className="text-[11px] text-gray-600 mt-0.5">Manage international airport codes</p>
                    </div>
                    <div className="flex gap-1">
                        {/* <button
                            onClick={handleFetchFromInternet}
                            disabled={fetchingFromInternet}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download IATA codes from internet and add to database"
                        >
                            <Download className="h-3 w-3" />
                            {fetchingFromInternet ? 'Fetching...' : 'Fetch from Internet'}
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-[11px]"
                        >
                            <Upload className="h-3 w-3" />
                            Import Codes
                        </button> */}
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[11px]"
                        >
                            <Plus className="h-3 w-3" />
                            Add IATA Code
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-2">
                    <div className="bg-white rounded shadow p-1.5">
                        <div className="flex items-center">
                            <div className="p-1 bg-blue-100 rounded">
                                <Plane className="h-2.5 w-2.5 text-blue-600" />
                            </div>
                            <div className="ml-1.5">
                                <p className="text-[11px] font-medium text-gray-600">Total IATA Codes</p>
                                <p className="text-sm font-bold text-gray-900">{total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded shadow p-1.5">
                        <div className="flex items-center">
                            <div className="p-1 bg-green-100 rounded">
                                <Globe className="h-2.5 w-2.5 text-green-600" />
                            </div>
                            <div className="ml-1.5">
                                <p className="text-[11px] font-medium text-gray-600">Active Airports</p>
                                <p className="text-sm font-bold text-gray-900">{activeCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded shadow mb-2 p-1.5">
                    <div className="relative">
                        <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
                        <input
                            type="text"
                            placeholder="Search by code, airport name, city, or country..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setPage(1)
                            }}
                            className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-[11px]"
                        />
                    </div>
                </div>

                <div className="bg-white rounded shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">IATA</th>
                                    <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ICAO</th>
                                    <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Airport</th>
                                    <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">City</th>
                                    <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                    <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Region</th>
                                    <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-1.5 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {iataCodes.map((code) => (
                                    <tr key={code.id} className="hover:bg-gray-50">
                                        <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">{code.code}</td>
                                        <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{code.icao || 'N/A'}</td>
                                        <td className="px-1.5 py-1 text-[11px] text-gray-900">{code.airport}</td>
                                        <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{code.city || 'N/A'}</td>
                                        <td className="px-1.5 py-1 whitespace-nowrap text-[11px] text-gray-900">{code.country_code}</td>
                                        <td className="px-1.5 py-1 text-[11px] text-gray-900">{code.region_name || 'N/A'}</td>
                                        <td className="px-1.5 py-1 whitespace-nowrap">
                                            <span className={`inline-flex px-1 py-0.5 text-[10px] font-semibold rounded ${code.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {code.status}
                                            </span>
                                        </td>
                                        <td className="px-1.5 py-1 whitespace-nowrap text-[11px] font-medium">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEdit(code)} className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5" title="Edit">
                                                    <Edit className="h-2.5 w-2.5" />
                                                </button>
                                                <button onClick={() => handleDelete(code.id)} className="text-red-600 hover:text-red-900 flex items-center gap-0.5" title="Delete">
                                                    <Trash2 className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {iataCodes.length === 0 && !loading && (
                        <div className="text-center py-4">
                            <Plane className="mx-auto h-5 w-5 text-gray-400" />
                            <h3 className="mt-1 text-[11px] font-medium text-gray-900">No IATA codes found</h3>
                            <p className="mt-0.5 text-[11px] text-gray-500">
                                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new IATA code.'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                        <div className="text-gray-700">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} codes
                        </div>
                        <div className="flex items-center gap-1">
                            <label className="text-gray-700">Records per page:</label>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value))
                                    setPage(1) // Reset to first page when changing limit
                                }}
                                className="px-1.5 py-0.5 border border-gray-300 rounded text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    {total > limit && (
                        <div className="flex gap-1">
                            <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1} className="px-1.5 py-0.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                Previous
                            </button>
                            <button onClick={() => setPage(prev => prev + 1)} disabled={page * limit >= total} className="px-1.5 py-0.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                Next
                            </button>
                        </div>
                    )}
                </div>

                <IataCodeModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingIataCode(null)
                    }}
                    iataCode={editingIataCode}
                    onSave={handleSave}
                />

                <ImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={async () => {
                        await fetchIataCodes()
                    }}
                />
            </div>
        </div>
    )
}

export default IataCodes
