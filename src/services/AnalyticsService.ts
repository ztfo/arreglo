import { ArrangementAnalytics, SongData, ArrangementData, ApiConfig } from '../core/types';
import { supabase } from '../core/supabase';
import { defaultConfig } from '../core/config';

export class AnalyticsService {
    private static readonly STORAGE_KEY = 'arreglo_analytics';

    private static sanitizeData(data: any): any {
        // Remove any potentially sensitive information
        if (data.title) data.title = '[REDACTED]';
        return data;
    }

    public static async collectArrangementData(
        songData: SongData,
        arrangementData: ArrangementData,
        apiUsed: 'openai' | 'anthropic',
        processingTime: number,
        success: boolean,
        error?: string
    ): Promise<void> {
        try {
            // Check consent
            const settings = await this.getSettings();
            if (!settings.DATA_COLLECTION_CONSENT) return;

            const analyticsData: ArrangementAnalytics = {
                timestamp: new Date().toISOString(),
                requestData: {
                    songData: this.sanitizeData({ ...songData }),
                    // Store prompt if needed
                },
                responseData: {
                    arrangementData: this.sanitizeData({ ...arrangementData }),
                    rawResponse: arrangementData.rawResponse
                },
                metadata: {
                    apiUsed,
                    processingTime,
                    success,
                    error
                },
                userConsent: true
            };

            // Send to Supabase
            const { error: supabaseError } = await supabase
                .from('arrangements')
                .insert([analyticsData]);

            if (supabaseError) {
                console.error('Failed to save analytics:', supabaseError);
            }

        } catch (error) {
            console.error('Analytics collection failed:', error);
            // Fail silently - don't impact user experience
        }
    }

    private static async getSettings(): Promise<ApiConfig> {
        return await figma.clientStorage.getAsync('arreglo_settings') || defaultConfig;
    }
} 