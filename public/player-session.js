/**
 * PlayerSession - Manages the local frontend state of the user for Summoning.
 * Interacts with the backend via ApiClient for the actual RNG resolution.
 */
const PlayerSession = (() => {
    const createGameState = (expansionId = null) => ({
        expansionId,
        collection: [],
        history: [],
        energy: {
            available: 0,
            max: 6,
            nextSummonAt: null,
            bonus: 0
        }
    });

    const canSummon = (state) => state.energy.available > 0 || state.energy.bonus > 0;

    const performSummon = async (state) => {
        if (!canSummon(state)) {
            return { success: false, reason: "Sem energia." };
        }

        try {
            const user = AuthManager.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            const response = await ApiClient.post(`/api/collection/${user.id}/roll`, {
                expansionId: state.expansionId
            });

            if (response.success) {
                const result = response.rollData;

                // Keep local UI state in sync
                if (response.consumedBonus && state.energy.bonus > 0) {
                    state.energy.bonus -= 1;
                } else if (state.energy.available > 0) {
                    state.energy.available -= 1;
                }

                state.collection.push(...result.cards);
                state.history.push(result);

                return { success: true, result };
            } else {
                return { success: false, reason: response.error || "Erro ao evocar." };
            }
        } catch (error) {
            console.error("[PlayerSession] Summon failed", error);
            return { success: false, reason: error.message || "Erro de comunicação com o servidor." };
        }
    };

    return {
        createGameState,
        canSummon,
        performSummon
    };
})();
