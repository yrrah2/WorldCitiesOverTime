import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

def plot_polygons(polygons, ax=None, alpha=0.5, linewidth=0.7, saveas=None, show=True):
    # Configure plot 
    if ax is None:
        plt.figure(figsize=(5,5))
        ax = plt.subplot(111)
    # Remove ticks
    ax.set_xticks([])
    ax.set_yticks([])
    ax.axis("equal")
    # Set limits
    ax.set_xlim(0,1)
    ax.set_ylim(0,1)
    # Add polygons 
    for poly in polygons:
        colored_cell = Polygon(poly,
                               linewidth=linewidth,
                               alpha=alpha,
                               facecolor=random_color(as_str=False, alpha=1),
                               edgecolor="black")
        ax.add_patch(colored_cell)
    if not saveas is None:
        plt.savefig(saveas)
    if show:
        plt.show()
    return ax 
