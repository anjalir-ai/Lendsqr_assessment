import axios, { AxiosError } from 'axios';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { KarmaResult } from './adjutor.types.js';

interface AdjutorResponse {
  status?: string;
  message?: string;
  data?: { karma_identity?: string; reason?: string };
}

export class AdjutorClient {
  async checkKarma(identity: string): Promise<KarmaResult> {
    const isLocalRuntime = env.NODE_ENV !== 'production';
    const hasPlaceholderKey = ['dev_dummy_key', 'replace-me', 'test-key'].includes(env.ADJUTOR_API_KEY);

    if (isLocalRuntime && hasPlaceholderKey) {
      return { blacklisted: false };
    }

    try {
      const response = await axios.get<AdjutorResponse>(`${env.ADJUTOR_BASE_URL}/verification/karma/${encodeURIComponent(identity)}`, {
        headers: { Authorization: `Bearer ${env.ADJUTOR_API_KEY}` },
        timeout: 8_000
      });

      const blacklisted = Boolean(response.data.data?.karma_identity) || response.data.status === 'success';
      return { blacklisted, reason: response.data.data?.reason ?? response.data.message };
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return { blacklisted: false };
      }
      if (env.ADJUTOR_BYPASS_ON_FAILURE && isLocalRuntime) {
        return { blacklisted: false };
      }
      throw new AppError(503, 'Unable to complete required Adjutor Karma blacklist check', 'ADJUTOR_UNAVAILABLE');
    }
  }
}

export const adjutorClient = new AdjutorClient();
