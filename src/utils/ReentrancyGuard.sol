// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title ReentrancyGuard
 * @notice Guardia de reentrada basada en estado (custom, sin OZ).
 * @dev Usar `nonReentrant` en `cancelListing` y `buyItem` (CEI + bloqueo de callback).
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    /// @notice Llamada reentrante detectada.
    error ReentrancyGuardReentrantCall();

    /// @dev 1 = libre, 2 = ocupado (valores distintos de 0/1 por gas refund legacy).
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Impide reentrada mientras la función protegida está en ejecución.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        if (_status == _ENTERED) revert ReentrancyGuardReentrantCall();
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = _NOT_ENTERED;
    }
}
