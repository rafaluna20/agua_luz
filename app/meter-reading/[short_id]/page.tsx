'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Camera, CheckCircle2, AlertCircle, Loader2, MapPin, Droplets, Zap } from 'lucide-react'
import axios from 'axios'
import Image from 'next/image'
import { config } from '@/lib/config'

interface MeterInfo {
    meter_id: string
    service: 'water' | 'electricity'
    location: {
        stage: string
        block: string
        lot: string
    }
    last_reading: {
        value: number
        date: string
    }
}

export default function MeterReadingPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const shortId = params.short_id as string
    const token = searchParams.get('t')

    const [meterInfo, setMeterInfo] = useState<MeterInfo | null>(null)
    const [readingValue, setReadingValue] = useState('')
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null)

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (token) {
            fetchMeterInfo()
            requestGPS()
        } else {
            setError('Token de seguridad no proporcionado')
            setLoading(false)
        }
    }, [token])

    const fetchMeterInfo = async () => {
        try {
            setLoading(true)
            setError('')

            // Extract signature from search params (hook is already available as searchParams)
            const signature = searchParams.get('s')
            const meter_id = shortId

            const response = await axios.post(
                `${config.apiUrl}/api/portal/meter/info`,
                {
                    token,
                    signature,
                    meter_id
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            )

            const result = response.data.result || response.data
            if (result.success) {
                setMeterInfo(result.data)
            } else {
                throw new Error(result.error || 'Error al obtener información del medidor')
            }
        } catch (err: any) {
            console.error('Error fetching meter info:', err)
            setError(err.response?.data?.error || err.message || 'Código QR inválido o expirado')
        } finally {
            setLoading(false)
        }
    }

    const requestGPS = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGpsCoords({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    })
                },
                (error) => {
                    console.warn('GPS not available:', error)
                }
            )
        }
    }

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhotoFile(file)

            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setPhotoPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const validateReading = (): string | null => {
        const reading = parseFloat(readingValue)

        if (isNaN(reading) || reading < 0) {
            return 'Por favor, ingrese un valor numérico válido'
        }

        if (meterInfo && reading < meterInfo.last_reading.value) {
            return `La lectura (${reading}) no puede ser menor que la última lectura (${meterInfo.last_reading.value})`
        }

        const maxIncrease = 1000
        if (meterInfo && reading > meterInfo.last_reading.value + maxIncrease) {
            return `La lectura parece muy alta. ¿Consumo de ${(reading - meterInfo.last_reading.value).toFixed(1)} ${meterInfo.service === 'water' ? 'm³' : 'kWh'}?`
        }

        return null
    }

    const submitReading = async () => {
        setError('')

        const validationError = validateReading()
        if (validationError) {
            setError(validationError)
            return
        }

        setSubmitting(true)

        try {
            // Convert photo to base64 if exists
            let photoBase64 = null
            if (photoFile) {
                const reader = new FileReader()
                photoBase64 = await new Promise<string>((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string)
                    reader.readAsDataURL(photoFile)
                })
            }

            // Submit to backend
            const response = await axios.post(
                `${config.apiUrl}/api/portal/meter/reading/submit`,
                {
                    token,
                    reading_value: parseFloat(readingValue),
                    photo_base64: photoBase64,
                    gps_lat: gpsCoords?.lat,
                    gps_lon: gpsCoords?.lon
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (response.data.success || response.data.result?.success) {
                setSuccess(true)
            } else {
                throw new Error(response.data.error || 'Error al enviar la lectura')
            }
        } catch (err: any) {
            console.error('Error submitting reading:', err)
            setError(err.response?.data?.error || err.message || 'Error al enviar la lectura')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Cargando información del medidor...</p>
                </div>
            </div>
        )
    }

    if (error && !meterInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Error
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        ¡Lectura Registrada!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        La lectura ha sido enviada exitosamente.
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Medidor</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{meterInfo?.meter_id}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Lectura</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {parseFloat(readingValue).toLocaleString()}
                        </p>
                        {meterInfo && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Consumo: {(parseFloat(readingValue) - meterInfo.last_reading.value).toFixed(1)} {meterInfo.service === 'water' ? 'm³' : 'kWh'}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Registrar Otra Lectura
                    </button>
                </div>
            </div>
        )
    }

    const ServiceIcon = meterInfo?.service === 'water' ? Droplets : Zap
    const serviceColor = meterInfo?.service === 'water' ? 'blue' : 'yellow'

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 bg-${serviceColor}-100 dark:bg-${serviceColor}-900/30 rounded-lg`}>
                            <ServiceIcon className={`w-8 h-8 text-${serviceColor}-600 dark:text-${serviceColor}-400`} />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {meterInfo?.meter_id}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {meterInfo?.service === 'water' ? '💧 Medidor de Agua' : '⚡ Medidor de Luz'}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>
                                    {meterInfo?.location.stage} • Mz {meterInfo?.location.block} • Lt {meterInfo?.location.lot}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last Reading Info */}
                {meterInfo && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-1">
                            Última Lectura Registrada
                        </p>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                            {meterInfo.last_reading.value.toLocaleString()}
                        </p>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                            {new Date(meterInfo.last_reading.date).toLocaleDateString('es-PE')}
                        </p>
                    </div>
                )}

                {/* Reading Input */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nueva Lectura
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={readingValue}
                        onChange={(e) => setReadingValue(e.target.value)}
                        placeholder={`Mayor a ${meterInfo?.last_reading.value || 0}`}
                        className="w-full px-4 py-4 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {readingValue && meterInfo && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Consumo estimado: <span className="font-semibold">{(parseFloat(readingValue) - meterInfo.last_reading.value).toFixed(1)} {meterInfo.service === 'water' ? 'm³' : 'kWh'}</span>
                        </p>
                    )}
                </div>

                {/* Photo Capture */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Foto del Medidor (Opcional)
                    </label>

                    {!photoPreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <Camera className="w-12 h-12 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toca para tomar foto</p>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoCapture}
                                className="hidden"
                            />
                        </label>
                    ) : (
                        <div className="relative">
                            <Image
                                src={photoPreview}
                                alt="Preview"
                                width={600}
                                height={400}
                                className="w-full rounded-lg"
                            />
                            <button
                                onClick={() => {
                                    setPhotoFile(null)
                                    setPhotoPreview(null)
                                }}
                                className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-sm rounded-lg shadow-lg"
                            >
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>

                {/* GPS Info */}
                {gpsCoords && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <p className="text-xs text-green-700 dark:text-green-400">
                            Ubicación GPS capturada
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={submitReading}
                    disabled={!readingValue || submitting}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg disabled:cursor-not-allowed text-lg"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Enviar Lectura
                        </>
                    )}
                </button>

                {/* Help Text */}
                <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                    Asegúrate de que el valor sea correcto antes de enviar.
                    <br />
                    La lectura quedará registrada de forma permanente.
                </p>
            </div>
        </div>
    )
}
