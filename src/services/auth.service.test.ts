import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                })),
            })),
        })),
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve realizar login com sucesso e retornar perfil', async () => {
        const mockUser = { id: '123', email: 'test@test.com' };
        const mockSession = { access_token: 'abc' };
        const mockProfile = { id: '123', role: 'CHEFE_OFICINA' };

        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
        });

        const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
        (supabase.from as any).mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: mockSingle,
                })),
            })),
        });

        const result = await authService.login({ email: 'test@test.com', password: 'password' });

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@test.com',
            password: 'password',
        });
        expect(result.user).toEqual(mockUser);
        expect(result.profile).toEqual(mockProfile);
    });

    it('deve lançar erro se o login falhar', async () => {
        const mockError = { message: 'Invalid credentials' };
        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            data: { user: null, session: null },
            error: mockError,
        });

        await expect(authService.login({ email: 'test@test.com', password: 'wrong' }))
            .rejects.toThrow('Invalid credentials');
    });

    it('deve retornar perfil nulo se o perfil não for encontrado mas o login for ok', async () => {
        const mockUser = { id: '123' };
        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            data: { user: mockUser, session: {} },
            error: null,
        });

        const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
        (supabase.from as any).mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: mockSingle,
                })),
            })),
        });

        const result = await authService.login({ email: 'test@test.com', password: 'password' });
        expect(result.profile).toBeNull();
    });
});
