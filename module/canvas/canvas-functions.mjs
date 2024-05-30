/** Maps a number from a given range to an equivalent number of another range */
export function mapRange(num, inMin, inMax, outMin, outMax) {
    if (inMin === inMax || outMin === outMax)
        return 0;
    const mapped = ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return CONFIG.WW.IS_V12 ? Math.clamp(mapped, outMin, outMax) : Math.clamped(mapped, outMin, outMax); // Foundry V11 legacy support; remove game.release.generation
}