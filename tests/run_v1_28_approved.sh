#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pytest -q \
 tests/test_coach_v1_8.py \
 tests/test_compact_score_delta_v1_18_1.py \
 tests/test_document_spec_v1_6_5.py \
 tests/test_empty_analysis_state_v1_12_5.py \
 tests/test_history_delete_v1_28.py \
 tests/test_icon_v1_6_10.py \
 tests/test_library_v1_6_0.py \
 tests/test_live_court_player_focus_v1_13.py \
 tests/test_live_score_momentum_v1_19_1.py \
 tests/test_match_library_v1_27.py \
 tests/test_navigation_visual_v1_25.py \
 tests/test_player_court_palette_v1_15.py \
 tests/test_rotation_setup_v1_6_4.py \
 tests/test_runtime_input_v1_28.py \
 tests/test_score_fault_evolution_v1_18.py \
 tests/test_spectator_ranking_v1_20.py \
 tests/test_spectator_timeline_v1_15.py \
 tests/test_spectator_view_v1_26.py \
 tests/test_spectator_view_v1_26_1.py \
 tests/test_team_management_v1_24.py \
 tests/test_timeline_alignment_v1_16_2.py \
 tests/test_timeline_layout_v1_16_1.py \
 tests/test_timeline_update_v1_16.py \
 tests/test_ui_modification_v1_6_8.py \
 tests/test_unified_v2_1.py \
 tests/test_update10_live_graph_v1_17.py \
 tests/test_update_ui_v1_12.py \
 tests/test_v1_7_home.py \
 tests/test_visual_theme_v1_10_1.py \
 tests/test_e2e_pwa.py::test_pwa_cache_version_and_shell_assets
