import { useState } from 'react';
import { Plus, Clock, Package, Trash2, Copy, Edit, ChevronRight } from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, Input } from '../components';
import { Modal } from '../components/Modal';
import { useBuildRecipes, usePermission } from '../state';
import { BuildRecipe } from '../types';

// Sample recipes for demo
const sampleRecipes: BuildRecipe[] = [
  {
    id: 'recipe-1',
    name: 'PixLite A4-S 4-Output - Apache 2800',
    outputItemSku: 'PXL-4OUT-STD',
    outputItemName: 'KG3 PixLite 4-Output Control Box',
    components: [
      { sku: 'ENC-APACHE-2800', itemName: 'Apache 2800 Enclosure', quantity: 1 },
      { sku: 'CTRL-A4S-MK3', itemName: 'Advatek PixLite A4-S Mk3', quantity: 1 },
      { sku: 'PSU-MW-24V13A', itemName: 'Meanwell 24V 13.3A PSU', quantity: 1 },
      { sku: 'PLATE-4D-1T1', itemName: '4x D Series / 1x True1 (Left)', quantity: 1 },
      { sku: 'PLATE-2D-1T1', itemName: '2x D Series / 1x True1 (Right)', quantity: 1 },
      { sku: 'CONN-NL4', itemName: 'Speakon NL4 Panel Mount', quantity: 6 },
      { sku: 'CONN-PWRCON-IN', itemName: 'PowerCon TRUE1 In', quantity: 2 },
      { sku: 'CONN-ETHERCON', itemName: 'Neutrik EtherCon RJ45', quantity: 1 },
    ],
    estimatedBuildTime: 120,
    instructions: 'Standard 4-output PixLite build for Apache 2800 case. Mount controller, wire PSU, install plates, test all outputs.',
    createdBy: 'kenny@kg3.io',
    createdAt: '2024-01-15T10:00:00Z',
    lastUsed: '2024-12-20T14:30:00Z',
  },
  {
    id: 'recipe-2',
    name: 'WLED 4-Output Budget Box',
    outputItemSku: 'WLED-4OUT-BUD',
    outputItemName: 'KG3 WLED 4-Output Budget Controller',
    components: [
      { sku: 'ENC-APACHE-1800', itemName: 'Apache 1800 Enclosure', quantity: 1 },
      { sku: 'CTRL-WLED-4', itemName: 'WLED 4-Output Controller', quantity: 1 },
      { sku: 'PSU-MW-5V10A', itemName: 'Meanwell 5V 10A PSU', quantity: 1 },
      { sku: 'PLATE-2GANG-DECORA', itemName: '2-Gang Decora Plate', quantity: 2 },
      { sku: 'CONN-ETHERCON', itemName: 'Neutrik EtherCon RJ45', quantity: 1 },
    ],
    estimatedBuildTime: 60,
    instructions: 'Budget WLED controller build. Simpler wiring, fewer outputs.',
    createdBy: 'zach@kg3.io',
    createdAt: '2024-02-10T09:00:00Z',
    lastUsed: '2024-11-15T11:00:00Z',
  },
  {
    id: 'recipe-3',
    name: 'DMX 4-Universe Decoder',
    outputItemSku: 'DMX-4UNI-DEC',
    outputItemName: 'KG3 DMX 4-Universe Decoder Box',
    components: [
      { sku: 'ENC-APACHE-2800', itemName: 'Apache 2800 Enclosure', quantity: 1 },
      { sku: 'CTRL-LEDMX2MAX', itemName: 'DMXking LeDMX2 MAX', quantity: 2 },
      { sku: 'PSU-MW-12V5A', itemName: 'Meanwell 12V 5A PSU', quantity: 1 },
      { sku: 'PLATE-8GANG-XLR', itemName: '8-Gang XLR Plate', quantity: 1 },
      { sku: 'CONN-XLR5F', itemName: '5-Pin XLR Female', quantity: 4 },
      { sku: 'CONN-XLR3F', itemName: '3-Pin XLR Female', quantity: 4 },
    ],
    estimatedBuildTime: 90,
    instructions: 'DMX decoder box with dual LeDMX2 for 4 universe output.',
    createdBy: 'nathan@kg3.io',
    createdAt: '2024-03-05T14:00:00Z',
  },
];

export function Recipes() {
  const { buildRecipes, deleteRecipe } = useBuildRecipes();
  const { hasPermission } = usePermission();

  const [selectedRecipe, setSelectedRecipe] = useState<BuildRecipe | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Combine stored recipes with sample recipes for demo
  const allRecipes = [...Object.values(buildRecipes), ...sampleRecipes];

  // Filter recipes by search
  const filteredRecipes = allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.outputItemSku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateCost = (recipe: BuildRecipe) => {
    // Mock pricing - in real app would look up from inventory
    const prices: Record<string, number> = {
      'ENC-APACHE-2800': 45,
      'ENC-APACHE-1800': 35,
      'CTRL-A4S-MK3': 285,
      'CTRL-WLED-4': 145,
      'CTRL-LEDMX2MAX': 195,
      'PSU-MW-24V13A': 48,
      'PSU-MW-5V10A': 32,
      'PSU-MW-12V5A': 28,
      'PLATE-4D-1T1': 14,
      'PLATE-2D-1T1': 10,
      'PLATE-2GANG-DECORA': 8,
      'PLATE-8GANG-XLR': 15,
      'CONN-NL4': 4.5,
      'CONN-PWRCON-IN': 7,
      'CONN-ETHERCON': 6,
      'CONN-XLR5F': 4.5,
      'CONN-XLR3F': 3.5,
    };

    return recipe.components.reduce((total, comp) => {
      const price = prices[comp.sku] || 0;
      return total + (price * comp.quantity);
    }, 0);
  };

  const openDetailModal = (recipe: BuildRecipe) => {
    setSelectedRecipe(recipe);
    setShowDetailModal(true);
  };

  const handleDelete = () => {
    if (selectedRecipe) {
      deleteRecipe(selectedRecipe.id);
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedRecipe(null);
    }
  };

  const handleUseRecipe = (recipe: BuildRecipe) => {
    // Navigate to builder with recipe pre-filled
    // For now just show alert
    alert(`Using recipe: ${recipe.name}\nThis would pre-fill the Controller Builder.`);
  };

  return (
    <PageTemplate
      title="Build Recipes"
      actions={
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => window.location.href = '/builder'}
        >
          New Recipe
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 font-mono mb-2">No build recipes yet</p>
            <p className="text-slate-500 text-sm font-mono mb-4">
              Create one from the Controller Builder
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => window.location.href = '/builder'}
            >
              Create Recipe
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <button
              key={recipe.id}
              onClick={() => openDetailModal(recipe)}
              className="
                bg-slate-900/50 border border-slate-700 rounded-lg p-4
                text-left hover:border-blue-500/50 transition-colors
              "
            >
              {/* Recipe Name */}
              <div className="font-mono text-slate-200 mb-1">{recipe.name}</div>
              <div className="text-xs font-mono text-slate-500 mb-3">{recipe.outputItemSku}</div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mb-3">
                <div className="flex items-center gap-1">
                  <Package size={12} />
                  {recipe.components.length} parts
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTime(recipe.estimatedBuildTime)}
                </div>
              </div>

              {/* Cost & Last Used */}
              <div className="flex items-center justify-between">
                <div className="text-blue-400 font-mono text-sm">
                  ${calculateCost(recipe).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Last: {formatDate(recipe.lastUsed)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRecipe(null);
          }}
          title="Recipe Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-mono text-slate-100 mb-1">
                {selectedRecipe.name}
              </h2>
              <div className="flex items-center gap-4 text-sm font-mono text-slate-500">
                <span>SKU: {selectedRecipe.outputItemSku}</span>
                <span>Created by: {selectedRecipe.createdBy}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-500 text-xs font-mono uppercase mb-1">Components</div>
                <div className="text-xl font-mono text-slate-200">
                  {selectedRecipe.components.length}
                </div>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-500 text-xs font-mono uppercase mb-1">Build Time</div>
                <div className="text-xl font-mono text-slate-200">
                  {formatTime(selectedRecipe.estimatedBuildTime)}
                </div>
              </div>
              <div className="bg-slate-800/30 border border-blue-500/30 rounded-lg p-4">
                <div className="text-slate-500 text-xs font-mono uppercase mb-1">Total Cost</div>
                <div className="text-xl font-mono text-blue-400">
                  ${calculateCost(selectedRecipe).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Components List */}
            <div>
              <h3 className="text-sm font-mono text-slate-400 mb-3">Components</h3>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-xs font-mono text-slate-500 uppercase p-3">Part</th>
                      <th className="text-center text-xs font-mono text-slate-500 uppercase p-3">Qty</th>
                      <th className="text-right text-xs font-mono text-slate-500 uppercase p-3">SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecipe.components.map((comp, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 last:border-0">
                        <td className="p-3 font-mono text-slate-200 text-sm">{comp.itemName}</td>
                        <td className="p-3 font-mono text-slate-300 text-center">{comp.quantity}</td>
                        <td className="p-3 font-mono text-slate-500 text-right text-sm">{comp.sku}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Instructions */}
            {selectedRecipe.instructions && (
              <div>
                <h3 className="text-sm font-mono text-slate-400 mb-2">Instructions</h3>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-300 font-mono text-sm">{selectedRecipe.instructions}</p>
                </div>
              </div>
            )}

            {/* Usage History */}
            <div className="flex items-center gap-4 text-sm font-mono text-slate-500">
              <span>Created: {formatDate(selectedRecipe.createdAt)}</span>
              {selectedRecipe.lastUsed && (
                <span>Last used: {formatDate(selectedRecipe.lastUsed)}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button
                variant="primary"
                icon={ChevronRight}
                onClick={() => handleUseRecipe(selectedRecipe)}
                className="flex-1"
              >
                Use Recipe
              </Button>
              {hasPermission('inventory.edit') && (
                <Button
                  variant="ghost"
                  icon={Copy}
                  onClick={() => alert('Duplicate recipe')}
                >
                  Duplicate
                </Button>
              )}
              {hasPermission('inventory.edit') && (
                <Button
                  variant="ghost"
                  icon={Edit}
                  onClick={() => alert('Edit recipe')}
                >
                  Edit
                </Button>
              )}
              {hasPermission('users.manage') && (
                <Button
                  variant="ghost"
                  icon={Trash2}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Recipe?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-400 font-mono text-sm">
            Are you sure you want to delete "{selectedRecipe?.name}"? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
