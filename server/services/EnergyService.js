const UserRepository = require('../repositories/UserRepository');
const AppError = require('../helpers/AppError');

const MAX_SUMMONS = 6;
const SUMMON_COOLDOWN_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

class EnergyService {
    static calculateSummons(user) {
        let { availableSummons = MAX_SUMMONS, lastSummonAt } = user;

        if (availableSummons >= MAX_SUMMONS || !lastSummonAt) {
            return { availableSummons: MAX_SUMMONS, lastSummonAt: null, nextSummonAt: null };
        }

        const now = Date.now();
        const last = new Date(lastSummonAt).getTime();
        const elapsed = now - last;
        const earned = Math.floor(elapsed / SUMMON_COOLDOWN_MS);

        if (earned > 0) {
            availableSummons = Math.min(MAX_SUMMONS, availableSummons + earned);
            if (availableSummons === MAX_SUMMONS) {
                lastSummonAt = null; // Reached max, stop counting
            } else {
                lastSummonAt = new Date(last + (earned * SUMMON_COOLDOWN_MS)).toISOString();
            }
        }

        const nextSummonAt = lastSummonAt ? new Date(new Date(lastSummonAt).getTime() + SUMMON_COOLDOWN_MS).toISOString() : null;

        return { availableSummons, lastSummonAt, nextSummonAt };
    }

    static async getUserStatus(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuário não encontrado.', 404);
        }

        const status = this.calculateSummons(user);

        // Update user if state changed (lazy update)
        if (status.availableSummons !== user.availableSummons || status.lastSummonAt !== user.lastSummonAt) {
            await UserRepository.save({ ...user, ...status });
        }

        return {
            availableSummons: status.availableSummons,
            maxSummons: MAX_SUMMONS,
            nextSummonAt: status.nextSummonAt
        };
    }

    static async consumeEnergy(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuário não encontrado.', 404);
        }

        let status = this.calculateSummons(user);

        if (status.availableSummons <= 0) {
            throw new AppError('Sem energia. Aguarde o retorno do poder de invocação.', 403);
        }

        status.availableSummons -= 1;
        if (!status.lastSummonAt) {
            status.lastSummonAt = new Date().toISOString();
        }

        await UserRepository.save({ ...user, ...status });
        return { success: true };
    }
}

module.exports = EnergyService;
