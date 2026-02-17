'use client'

import { useState, useEffect } from 'react'
import { Download, QrCode, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Cookies from 'js-cookie'
import { qrGeneratorService, Stage, Block, QRGeneratorFilters as ServiceFilters } from '@/lib/services/qr-generator.service'

interface QRGeneratorFilters {
    serviceType: 'water' | 'electricity' | 'both'
    stage?: string
    block?: string
    lotFrom?: number
    lotTo?: number
}


export default function QRGeneratorPage() {
    const [filters, setFilters] = useState<QRGeneratorFilters>({
        serviceType: 'both'
    })

    const [stages, setStages] = useState<Stage[]>([])
    const [blocks, setBlocks] = useState<Block[]>([])
    const [loading, setLoading] = useState(false)
    const [estimatedCount, setEstimatedCount] = useState<number | null>(null)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    // Load stages and blocks on mount
    useEffect(() => {
        loadStagesAndBlocks()
    }, [])

    // Estimate meter count when filters change
    useEffect(() => {
        estimateMeterCount()
    }, [filters])

    const loadStagesAndBlocks = async () => {
        try {
            const [stagesData, blocksData] = await Promise.all([
                qrGeneratorService.getStages(),
                qrGeneratorService.getBlocks()
            ])

            setStages(stagesData)
            setBlocks(blocksData)
        } catch (error) {
            console.error('Error loading filters:', error)
        }
    }

    const estimateMeterCount = async () => {
        try {
            // Build service filters
            const serviceFilters: ServiceFilters = {}

            if (filters.serviceType !== 'both') {
                serviceFilters.service = filters.serviceType
            }
            if (filters.stage) {
                serviceFilters.stage = parseInt(filters.stage)
            }
            if (filters.block) {
                serviceFilters.block = parseInt(filters.block)
            }
            if (filters.lotFrom) {
                serviceFilters.lot_from = filters.lotFrom
            }
            if (filters.lotTo) {
                serviceFilters.lot_to = filters.lotTo
            }

            const count = await qrGeneratorService.countMeters(serviceFilters)
            setEstimatedCount(count)
        } catch (error) {
            console.error('Error estimating count:', error)
            setEstimatedCount(0)
        }
    }

    const generateAndDownloadPDF = async () => {
        try {
            setLoading(true)
            setSuccessMessage('')
            setErrorMessage('')

            // Build service filters
            const serviceFilters: ServiceFilters = {}

            if (filters.serviceType !== 'both') {
                serviceFilters.service = filters.serviceType
            }
            if (filters.stage) {
                serviceFilters.stage = parseInt(filters.stage)
            }
            if (filters.block) {
                serviceFilters.block = parseInt(filters.block)
            }
            if (filters.lotFrom) {
                serviceFilters.lot_from = filters.lotFrom
            }
            if (filters.lotTo) {
                serviceFilters.lot_to = filters.lotTo
            }

            // Get download URL from service
            const downloadURL = qrGeneratorService.generateBatchURL(serviceFilters)

            // Get auth token
            const token = Cookies.get('access_token')

            // Download PDF directly
            const response = await fetch(downloadURL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Error al generar PDF')
            }

            // Create blob and download
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `qr_labels_${filters.serviceType}_${estimatedCount}_medidores.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            setSuccessMessage(`✅ PDF generado exitosamente con ${estimatedCount} etiquetas QR`)
        } catch (error) {
            console.error('Error generating PDF:', error)
            setErrorMessage('Error al generar el PDF. Por favor, intente nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <QrCode className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Generador de Códigos QR
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Genere etiquetas QR masivas para lectura de medidores
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Filtros de Selección
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Service Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo de Servicio
                            </label>
                            <select
                                value={filters.serviceType}
                                onChange={(e) => setFilters({ ...filters, serviceType: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="both">Ambos (Agua + Luz)</option>
                                <option value="water">Solo Agua</option>
                                <option value="electricity">Solo Electricidad</option>
                            </select>
                        </div>

                        {/* Stage */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Etapa (Opcional)
                            </label>
                            <select
                                value={filters.stage || ''}
                                onChange={(e) => setFilters({ ...filters, stage: e.target.value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Todas las etapas</option>
                                {stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Block */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Manzana (Opcional)
                            </label>
                            <select
                                value={filters.block || ''}
                                onChange={(e) => setFilters({ ...filters, block: e.target.value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Todas las manzanas</option>
                                {blocks.map(block => (
                                    <option key={block.id} value={block.id}>{block.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lot Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Rango de Lotes (Opcional)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Desde"
                                    value={filters.lotFrom || ''}
                                    onChange={(e) => setFilters({ ...filters, lotFrom: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="number"
                                    placeholder="Hasta"
                                    value={filters.lotTo || ''}
                                    onChange={(e) => setFilters({ ...filters, lotTo: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estimation */}
                {estimatedCount !== null && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                                    Etiquetas QR a generar
                                </p>
                                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                    {estimatedCount.toLocaleString()}
                                </p>
                                <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                                    ≈ {Math.ceil(estimatedCount / 30)} páginas (formato Avery 5160)
                                </p>
                            </div>
                            <QrCode className="w-16 h-16 text-indigo-300 dark:text-indigo-700" />
                        </div>
                    </div>
                )}

                {/* Messages */}
                {successMessage && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-800 dark:text-red-300">{errorMessage}</p>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={generateAndDownloadPDF}
                    disabled={loading || estimatedCount === 0}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generando PDF...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Generar y Descargar PDF
                        </>
                    )}
                </button>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-sm">
                        ℹ️ Información Importante
                    </h3>
                    <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                        <li>• El PDF generado estará optimizado para hojas Avery 5160 (30 etiquetas por hoja)</li>
                        <li>• Cada etiqueta incluye: QR + Código legible + Ubicación + Última lectura</li>
                        <li>• Se recomienda imprimir en stickers UV-resistentes para medidores exteriores</li>
                        <li>• Los QR tienen validez de 1 año desde la fecha de generación</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
